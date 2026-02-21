const candidateForm = document.getElementById('candidate-form');
const cvForm = document.getElementById('cv-form');
const jobForm = document.getElementById('job-form');
const cvOutput = document.getElementById('cv-output');
const candidateSelect = document.getElementById('candidate-select');
const jobSelect = document.getElementById('job-select');
const matchBtn = document.getElementById('match-btn');
const matchOutput = document.getElementById('match-output');
const pipelineEl = document.getElementById('pipeline');
const statusOutput = document.getElementById('status-output');

let state = {
  candidates: [],
  jobs: [],
  pipelineStages: [],
  pipelineData: {},
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Beklenmeyen bir hata oluştu.');
  }

  return payload;
}

function notify(message, isError = false) {
  statusOutput.textContent = message;
  statusOutput.className = isError ? 'status error' : 'status';
}

function refreshSelects() {
  candidateSelect.innerHTML = state.candidates
    .map((c) => `<option value="${c.id}">${c.name} - ${c.role}</option>`)
    .join('');

  jobSelect.innerHTML = state.jobs
    .map((j) => `<option value="${j.id}">${j.title} (${j.minExperience}+ yıl)</option>`)
    .join('');
}

function renderPipeline() {
  pipelineEl.innerHTML = state.pipelineStages
    .map((stage) => {
      const cards = (state.pipelineData[stage] || [])
        .map((entry) => {
          const stageIdx = state.pipelineStages.indexOf(stage);
          const movable = stageIdx < state.pipelineStages.length - 1;
          return `
            <div class="card">
              <strong>${entry.name}</strong><br/>
              <small>${entry.role}</small><br/>
              ${
                movable
                  ? `<button data-stage="${stage}" data-candidate-id="${entry.id}" class="move-btn">İleri Taşı</button>`
                  : ''
              }
            </div>
          `;
        })
        .join('');

      return `<div class="column"><h3>${stage}</h3>${cards || '<small>Henüz aday yok</small>'}</div>`;
    })
    .join('');

  document.querySelectorAll('.move-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api('/api/pipeline/move', {
          method: 'POST',
          body: JSON.stringify({
            stage: btn.dataset.stage,
            candidateId: btn.dataset.candidateId,
          }),
        });
        await loadState();
        notify('Aday bir sonraki aşamaya taşındı.');
      } catch (error) {
        notify(error.message, true);
      }
    });
  });
}

async function loadState() {
  state = await api('/api/state');
  refreshSelects();
  renderPipeline();
}

candidateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(candidateForm);

  try {
    await api('/api/candidates', {
      method: 'POST',
      body: JSON.stringify({
        name: data.get('name'),
        role: data.get('role'),
        experience: data.get('experience'),
        skills: data.get('skills'),
        softSkills: data.get('softSkills'),
      }),
    });

    candidateForm.reset();
    await loadState();
    notify('Aday başarıyla kaydedildi.');
  } catch (error) {
    notify(error.message, true);
  }
});

cvForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const candidateId = candidateSelect.value;
    if (!candidateId) {
      notify('CV üretmek için önce aday ekleyin.', true);
      return;
    }

    const data = new FormData(cvForm);
    const response = await api('/api/cv/generate', {
      method: 'POST',
      body: JSON.stringify({
        candidateId,
        summary: data.get('summary'),
        achievement: data.get('achievement'),
        certifications: data.get('certifications'),
      }),
    });

    cvOutput.textContent = response.cvText;
    notify('CV taslağı üretildi.');
  } catch (error) {
    notify(error.message, true);
  }
});

jobForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(jobForm);

  try {
    await api('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: data.get('title'),
        minExperience: data.get('minExperience'),
        requiredSkills: data.get('requiredSkills'),
        requiredSoftSkills: data.get('requiredSoftSkills'),
      }),
    });

    jobForm.reset();
    await loadState();
    notify('İlan yayınlandı.');
  } catch (error) {
    notify(error.message, true);
  }
});

matchBtn.addEventListener('click', async () => {
  try {
    const candidateId = candidateSelect.value;
    const jobId = jobSelect.value;

    if (!candidateId || !jobId) {
      notify('Eşleşme için aday ve ilan seçin.', true);
      return;
    }

    const result = await api('/api/match', {
      method: 'POST',
      body: JSON.stringify({ candidateId, jobId }),
    });

    matchOutput.innerHTML = `
      <strong>${result.candidate.name}</strong> ↔ <strong>${result.job.title}</strong><br/>
      Uyum Skoru: <strong>%${result.totalScore}</strong> (${result.status})<br/>
      Eşleşen Teknik Yetkinlikler: ${result.skillMatches.join(', ') || 'Yok'}<br/>
      Eşleşen Sosyal Yetkinlikler: ${result.softSkillMatches.join(', ') || 'Yok'}
    `;
    notify('Eşleşme hesaplandı.');
  } catch (error) {
    notify(error.message, true);
  }
});

loadState().catch((error) => notify(error.message, true));
