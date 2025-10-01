const { execSync } = require('child_process');

function run(command) {
  console.log(`→ ${command}`);
  return execSync(command, { encoding: 'utf-8' });
}

try {
  const output = run('clasp deployments');
  // Ejemplo output:
  // Found 44 deployments.
  // - AKfycbzuy7NUSW5_sDBOOjMjcmyNgLJErl04MDBWqggzdrSf @HEAD
  // - AKfycbwHA79ahRPP3WO3123ZBBomnO7R_C7SaBjmBqszKnABv1qKanEeuZuDUvxPHERbrrKpLg @19 - dasdsa

  const lines = output.trim().split('\n').slice(1); // quitar la primera línea "Found X deployments."

  // Parsear cada línea
  const deployments = lines.map(line => {
    // Línea ejemplo:
    // - AKfycbzuy7NUSW5_sDBOOjMjcmyNgLJErl04MDBWqggzdrSf @HEAD
    // - AKfycbwHA79ahRPP3WO3123ZBBomnO7R_C7SaBjmBqszKnABv1qKanEeuZuDUvxPHERbrrKpLg @19 - dasdsa

    const match = line.match(/-\s+(\S+)\s+@(\S+)(?:\s+-\s+(.*))?/);
    if (!match) return null;

    const deploymentId = match[1];
    const versionStr = match[2];
    const description = match[3] || '';

    // versionNumber como número si es posible, sino 0 para @HEAD
    const version = versionStr === 'HEAD' ? 0 : parseInt(versionStr, 10);

    return { deploymentId, version, description };
  }).filter(Boolean);


  // Ordenar por versión descendente
  deployments.sort((a, b) => b.version - a.version);

  const toDelete = deployments;

  console.log('Deployments a borrar:', toDelete.map(d => d.deploymentId));

  // Borrar los antiguos
  for (const dep of toDelete) {
    try {
      run(`clasp undeploy ${dep.deploymentId}`);
      console.log(`✔ Deployment borrado: ${dep.deploymentId}`);
    } catch (e) {
      console.error(`❌ Error borrando ${dep.deploymentId}:`, e.message);
    }
  }

  console.log('✅ Limpieza finalizada.');

} catch (err) {
  console.error('❌ Error ejecutando comandos:', err.message);
}
