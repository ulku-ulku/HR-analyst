const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 4173;

const candidates = [];
const jobs = [
  {
    id: randomUUID(),
    title: 'Frontend Developer',
    minExperience: 2,
    requiredSkills: ['react', 'typescript', 'css'],
    requiredSoftSkills: ['iletişim', 'takım çalışması'],
  },
];

const pipelineStages = ['Başvuru', 'Ön Görüşme', 'Teknik Mülakat', 'Teklif', 'İşe Alındı'];
const pipelineData = Object.fromEntries(pipelineStages.map((stage) => [stage, []]));

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseList(value = '') {
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function calcMatch(candidate, job) {
  const skillMatches = job.requiredSkills.filter((skill) => candidate.skills.includes(skill));
  const softSkillMatches = job.requiredSoftSkills.filter((skill) => candidate.softSkills.includes(skill));

  const skillScore = job.requiredSkills.length ? (skillMatches.length / job.requiredSkills.length) * 60 : 60;
  const softSkillScore = job.requiredSoftSkills.length
    ? (softSkillMatches.length / job.requiredSoftSkills.length) * 20
    : 20;
  const expScore = Math.min((candidate.experience / Math.max(job.minExperience, 1)) * 20, 20);
  const totalScore = Math.round(skillScore + softSkillScore + expScore);
  const status = totalScore >= 75 ? 'Yüksek Uyum' : totalScore >= 50 ? 'Orta Uyum' : 'Düşük Uyum';

  return { totalScore, status, skillMatches, softSkillMatches };
}

function serveStatic(req, res) {
  const publicFile = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(process.cwd(), publicFile);

  if (!filePath.startsWith(process.cwd())) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true });
    }

    if (req.url === '/api/state' && req.method === 'GET') {
      return json(res, 200, { candidates, jobs, pipelineStages, pipelineData });
    }

    if (req.url === '/api/candidates' && req.method === 'POST') {
      const body = await readBody(req);
      const candidate = {
        id: randomUUID(),
        name: body.name,
        role: body.role,
        experience: Number(body.experience || 0),
        skills: parseList(body.skills),
        softSkills: parseList(body.softSkills),
      };

      if (!candidate.name || !candidate.role) {
        return json(res, 400, { message: 'name ve role zorunludur.' });
      }

      candidates.push(candidate);
      pipelineData['Başvuru'].push(candidate);
      return json(res, 201, candidate);
    }

    if (req.url === '/api/jobs' && req.method === 'POST') {
      const body = await readBody(req);
      const job = {
        id: randomUUID(),
        title: body.title,
        minExperience: Number(body.minExperience || 0),
        requiredSkills: parseList(body.requiredSkills),
        requiredSoftSkills: parseList(body.requiredSoftSkills),
      };

      if (!job.title) {
        return json(res, 400, { message: 'title zorunludur.' });
      }

      jobs.push(job);
      return json(res, 201, job);
    }

    if (req.url === '/api/cv/generate' && req.method === 'POST') {
      const body = await readBody(req);
      const candidate = candidates.find((item) => item.id === body.candidateId);

      if (!candidate) {
        return json(res, 404, { message: 'Aday bulunamadı.' });
      }

      const cvText = `# ${candidate.name}\n\nHedef Rol: ${candidate.role}\n\n## Profesyonel Özet\n${
        body.summary || ''
      }\n\n## Teknik Yetkinlikler\n${candidate.skills.join(', ')}\n\n## Sosyal Yetkinlikler\n${
        candidate.softSkills.join(', ') || 'Belirtilmedi'
      }\n\n## Son Proje / Başarı\n${body.achievement || ''}\n\n## Sertifikalar\n${
        body.certifications || 'Belirtilmedi'
      }`;

      return json(res, 200, { cvText });
    }

    if (req.url === '/api/match' && req.method === 'POST') {
      const body = await readBody(req);
      const candidate = candidates.find((item) => item.id === body.candidateId);
      const job = jobs.find((item) => item.id === body.jobId);

      if (!candidate || !job) {
        return json(res, 404, { message: 'Aday veya ilan bulunamadı.' });
      }

      return json(res, 200, {
        candidate,
        job,
        ...calcMatch(candidate, job),
      });
    }

    if (req.url === '/api/pipeline/move' && req.method === 'POST') {
      const body = await readBody(req);
      const stageIndex = pipelineStages.indexOf(body.stage);
      const targetStage = pipelineStages[stageIndex + 1];
      if (stageIndex === -1 || !targetStage) {
        return json(res, 400, { message: 'Geçersiz stage.' });
      }

      const index = pipelineData[body.stage].findIndex((item) => item.id === body.candidateId);
      if (index === -1) {
        return json(res, 404, { message: 'Aday bu aşamada bulunamadı.' });
      }

      const [candidate] = pipelineData[body.stage].splice(index, 1);
      pipelineData[targetStage].push(candidate);
      return json(res, 200, { ok: true, to: targetStage });
    }

    return serveStatic(req, res);
  } catch (error) {
    return json(res, 500, { message: error.message || 'Sunucu hatası.' });
  }
});

server.listen(PORT, () => {
  console.log(`HR Nexus backend running on http://localhost:${PORT}`);
});
