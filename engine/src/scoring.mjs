function normalize(value) {
  return String(value).trim().toLowerCase();
}

function overlap(left = [], right = []) {
  const rightSet = new Set(right.map(normalize));
  return left.map(normalize).filter((item) => rightSet.has(item));
}

export function scoreReference(reference, brief) {
  let score = 0;
  const reasons = [];

  const industryHits = overlap(reference.industries, [brief.industry]);
  if (industryHits.length > 0) {
    score += 30;
    reasons.push(`Industry fit: ${industryHits.join(", ")}`);
  }

  const typeHits = overlap(reference.siteTypes, [brief.siteType]);
  if (typeHits.length > 0) {
    score += 20;
    reasons.push(`Site type fit: ${typeHits.join(", ")}`);
  }

  const toneHits = overlap(reference.tone, brief.tone);
  if (toneHits.length > 0) {
    score += toneHits.length * 8;
    reasons.push(`Tone overlap: ${toneHits.join(", ")}`);
  }

  const goalHits = overlap(reference.strengths, brief.goals);
  if (goalHits.length > 0) {
    score += goalHits.length * 12;
    reasons.push(`Goal alignment: ${goalHits.join(", ")}`);
  }

  const requestedSignals = new Set((brief.featureSignals ?? []).map(normalize));
  const requiredSignals = (reference.requiresFeatureSignals ?? []).map(normalize);
  if (requiredSignals.length > 0) {
    const signalHits = requiredSignals.filter((signal) => requestedSignals.has(signal));
    if (signalHits.length > 0) {
      score += signalHits.length * 10;
      reasons.push(`Feature signals: ${signalHits.join(", ")}`);
    }
  }

  return { score, reasons };
}

export function chooseSection(referencePool, brief, sectionType, allowedCategories = []) {
  const allowedSet = new Set(allowedCategories.map(normalize));
  const candidates = referencePool
    .filter((reference) => normalize(reference.sectionType) === normalize(sectionType))
    .filter((reference) =>
      allowedSet.size === 0 || allowedSet.has(normalize(reference.sourceCategory))
    )
    .map((reference) => {
      const { score, reasons } = scoreReference(reference, brief);
      return { reference, score, reasons };
    })
    .sort((left, right) => right.score - left.score);

  return candidates[0] ?? null;
}
