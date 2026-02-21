const candidates = [];
const jobs = [
  {
    id: crypto.randomUUID(),
    title: "Frontend Developer",
    minExperience: 2,
    requiredSkills: ["react", "typescript", "css"],
    requiredSoftSkills: ["iletişim", "takım çalışması"],
  },
];

const pipelineStages = ["Başvuru", "Ön Görüşme", "Teknik Mülakat", "Teklif", "İşe Alındı"];
const pipelineData = Object.fromEntries(pipelineStages.map((stage) => [stage, []]));

const candidateForm = document.getElementById("candidate-form");
const cvForm = document.getElementById("cv-form");
const jobForm = document.getElementById("job-form");
const cvOutput = document.getElementById("cv-output");
const candidateSelect = document.getElementById("candidate-select");
const jobSelect = document.getElementById("job-select");
const matchBtn = document.getElementById("match-btn");
const matchOutput = document.getElementById("match-output");
const pipelineEl = document.getElementById("pipeline");

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function refreshSelects() {
  candidateSelect.innerHTML = candidates
    .map((c, i) => `<option value="${i}">${c.name} - ${c.role}</option>`)
    .join("");

  jobSelect.innerHTML = jobs
    .map((j, i) => `<option value="${i}">${j.title} (${j.minExperience}+ yıl)</option>`)
    .join("");
}

function renderPipeline() {
  pipelineEl.innerHTML = pipelineStages
    .map((stage) => {
      const cards = pipelineData[stage]
        .map(
          (entry, index) => `
          <div class="card">
            <strong>${entry.name}</strong><br/>
            <small>${entry.role}</small><br/>
            ${
              pipelineStages.indexOf(stage) < pipelineStages.length - 1
                ? `<button data-stage="${stage}" data-index="${index}" class="move-btn">İleri Taşı</button>`
                : ""
            }
          </div>`
        )
        .join("");

      return `<div class="column"><h3>${stage}</h3>${cards || "<small>Henüz aday yok</small>"}</div>`;
    })
    .join("");

  document.querySelectorAll(".move-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stage = btn.dataset.stage;
      const index = Number(btn.dataset.index);
      const nextStage = pipelineStages[pipelineStages.indexOf(stage) + 1];
      const [candidate] = pipelineData[stage].splice(index, 1);
      pipelineData[nextStage].push(candidate);
      renderPipeline();
    });
  });
}

candidateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(candidateForm);

  const candidate = {
    name: data.get("name"),
    role: data.get("role"),
    experience: Number(data.get("experience")),
    skills: parseList(data.get("skills") || ""),
    softSkills: parseList(data.get("softSkills") || ""),
  };

  candidates.push(candidate);
  pipelineData["Başvuru"].push(candidate);
  candidateForm.reset();
  refreshSelects();
  renderPipeline();
});

cvForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!candidates.length) {
    cvOutput.textContent = "Önce bir aday profili oluşturun.";
    return;
  }

  const activeCandidate = candidates[candidates.length - 1];
  const data = new FormData(cvForm);
  cvOutput.textContent = `# ${activeCandidate.name}\n
Hedef Rol: ${activeCandidate.role}\n
## Profesyonel Özet\n${data.get("summary")}\n
## Teknik Yetkinlikler\n${activeCandidate.skills.join(", ")}\n
## Sosyal Yetkinlikler\n${activeCandidate.softSkills.join(", ")}\n
## Son Proje / Başarı\n${data.get("achievement")}\n
## Sertifikalar\n${data.get("certifications") || "Belirtilmedi"}`;
});

jobForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(jobForm);

  jobs.push({
    id: crypto.randomUUID(),
    title: data.get("title"),
    minExperience: Number(data.get("minExperience")),
    requiredSkills: parseList(data.get("requiredSkills") || ""),
    requiredSoftSkills: parseList(data.get("requiredSoftSkills") || ""),
  });

  jobForm.reset();
  refreshSelects();
});

matchBtn.addEventListener("click", () => {
  const candidate = candidates[Number(candidateSelect.value)];
  const job = jobs[Number(jobSelect.value)];

  if (!candidate || !job) {
    matchOutput.textContent = "Eşleşme için aday ve ilan seçimi yapın.";
    return;
  }

  const skillMatches = job.requiredSkills.filter((skill) => candidate.skills.includes(skill));
  const softSkillMatches = job.requiredSoftSkills.filter((skill) => candidate.softSkills.includes(skill));

  const skillScore = job.requiredSkills.length
    ? (skillMatches.length / job.requiredSkills.length) * 60
    : 60;

  const softSkillScore = job.requiredSoftSkills.length
    ? (softSkillMatches.length / job.requiredSoftSkills.length) * 20
    : 20;

  const expScore = Math.min((candidate.experience / Math.max(job.minExperience, 1)) * 20, 20);
  const totalScore = Math.round(skillScore + softSkillScore + expScore);

  const status = totalScore >= 75 ? "Yüksek Uyum" : totalScore >= 50 ? "Orta Uyum" : "Düşük Uyum";

  matchOutput.innerHTML = `
    <strong>${candidate.name}</strong> ↔ <strong>${job.title}</strong><br/>
    Uyum Skoru: <strong>%${totalScore}</strong> (${status})<br/>
    Eşleşen Teknik Yetkinlikler: ${skillMatches.join(", ") || "Yok"}<br/>
    Eşleşen Sosyal Yetkinlikler: ${softSkillMatches.join(", ") || "Yok"}
  `;
});

refreshSelects();
renderPipeline();
