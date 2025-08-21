async function submitForm(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const resultEl = document.getElementById('result');
    const cardsEl = document.getElementById('resultCards');
    submitBtn.disabled = true;
    resultEl.style.display = 'block';
    cardsEl.innerHTML = '';
    resultEl.textContent = 'Generating personalized career advice...';
  
    const education = `${document.getElementById('degree').value}, ${document.getElementById('major').value}, ${document.getElementById('gradYear').value}, CGPA ${document.getElementById('cgpa').value}`;
    const skills = document.getElementById('skills').value;
    const interests = document.getElementById('interests').value;
    const careerGoals = `${document.getElementById('goals').value} | Location: ${document.getElementById('location').value} | Timeframe: ${document.getElementById('timeframe').value}`;
    const optional = {
      projects: document.getElementById('projects').value,
      internships: document.getElementById('internships').value,
      portfolio: document.getElementById('portfolio').value,
      constraints: document.getElementById('constraints').value,
      companyType: document.getElementById('companyType').value
    };
  
    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ education, skills, interests, careerGoals, optional })
      });
      const data = await res.json();
      const text = data.result || data.error || 'No response.';
      // Try to parse structured blocks into cards
      const cards = parseCareerAdvice(text);
      if (cards.length) {
        renderCards(cardsEl, cards);
        resultEl.style.display = 'none';
      } else {
        resultEl.textContent = text;
        resultEl.style.display = 'block';
      }
    } catch (e) {
      resultEl.textContent = 'Failed to fetch advice.';
    } finally {
      submitBtn.disabled = false;
    }
  }

function parseCareerAdvice(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const titleMatch = line.match(/^Career Path\s*\d+\s*:\s*(.+)$/i);
    if (titleMatch) {
      if (current) blocks.push(current);
      current = { title: titleMatch[1].trim(), why: '', skills: '', resources: '' };
      continue;
    }
    if (!current) continue;
    const why = line.match(/^-\s*Why suitable:\s*(.+)$/i);
    const skills = line.match(/^-\s*Required Skills:\s*(.+)$/i);
    const lr = line.match(/^-\s*Learning Resources:\s*(.+)$/i);
    if (why) current.why += (current.why ? ' ' : '') + why[1].trim();
    else if (skills) current.skills += (current.skills ? ' ' : '') + skills[1].trim();
    else if (lr) current.resources += (current.resources ? ' ' : '') + lr[1].trim();
  }
  if (current) blocks.push(current);
  return blocks;
}

function renderCards(container, cards) {
  const frag = document.createDocumentFragment();
  cards.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = 'career-card';
    card.dataset.role = c.title;

    const title = document.createElement('h4');
    title.className = 'career-title';
    title.textContent = `Career Path ${idx + 1}: ${c.title}`;
    card.appendChild(title);

    if (c.why) {
      const sec = document.createElement('div');
      sec.className = 'career-section';
      sec.innerHTML = `<strong>Why suitable:</strong> ${c.why}`;
      card.appendChild(sec);
    }
    if (c.skills) {
      const sec = document.createElement('div');
      sec.className = 'career-section';
      sec.innerHTML = `<strong>Required Skills:</strong> ${c.skills}`;
      card.appendChild(sec);
    }
    if (c.resources) {
      const sec = document.createElement('div');
      sec.className = 'career-section';
      sec.innerHTML = `<strong>Learning Resources:</strong> ${c.resources}`;
      card.appendChild(sec);
    }

    card.addEventListener('click', () => openPrepForRole(c.title));
    frag.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(frag);
}

async function openPrepForRole(role) {
  const modal = document.getElementById('prepModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  modalTitle.textContent = `Preparation Plan: ${role}`;
  modalContent.textContent = 'Generating preparation plan...';
  modal.style.display = 'flex';

  // Reuse current form values as profile context
  const profile = {
    education: `${document.getElementById('degree').value}, ${document.getElementById('major').value}, ${document.getElementById('gradYear').value}, CGPA ${document.getElementById('cgpa').value}`,
    skills: document.getElementById('skills').value,
    interests: document.getElementById('interests').value,
    careerGoals: `${document.getElementById('goals').value} | Location: ${document.getElementById('location').value} | Timeframe: ${document.getElementById('timeframe').value}`,
  };

  try {
    const data = await postJsonWithFallback('/api/prep', { profile, role });
    if (data.ok) {
      modalContent.textContent = data.body.result || 'No response.';
    } else {
      modalContent.textContent = data.body?.error || data.raw || 'Request failed.';
    }
  } catch (e) {
    modalContent.textContent = 'Failed to fetch preparation plan.';
  }
}

function closeModal() {
  const modal = document.getElementById('prepModal');
  modal.style.display = 'none';
}

async function postJsonWithFallback(path, payload) {
  const headers = { 'Content-Type': 'application/json' };
  // First try same-origin
  try {
    const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(payload) });
    const raw = await res.text();
    let body = {};
    try { body = JSON.parse(raw); } catch (_) {}
    if (res.ok) return { ok: true, body };
    // If 404 on same-origin, try alt port
    if (res.status === 404) {
      const alt = getAltOrigin() + path;
      const res2 = await fetch(alt, { method: 'POST', headers, body: JSON.stringify(payload) });
      const raw2 = await res2.text();
      let body2 = {};
      try { body2 = JSON.parse(raw2); } catch (_) {}
      return { ok: res2.ok, body: body2, raw: raw2 };
    }
    return { ok: false, body, raw };
  } catch (err) {
    // Network error → try alt origin
    try {
      const alt = getAltOrigin() + path;
      const res2 = await fetch(alt, { method: 'POST', headers, body: JSON.stringify(payload) });
      const raw2 = await res2.text();
      let body2 = {};
      try { body2 = JSON.parse(raw2); } catch (_) {}
      return { ok: res2.ok, body: body2, raw: raw2 };
    } catch (err2) {
      return { ok: false, body: {}, raw: String(err2) };
    }
  }
}

function getAltOrigin() {
  const m = location.origin.match(/:(\d+)$/);
  const port = m ? m[1] : '';
  if (port === '3000') return location.origin.replace(/:(\d+)$/, ':3001');
  if (port === '3001') return location.origin.replace(/:(\d+)$/, ':3000');
  return location.origin; // fallback
}
  