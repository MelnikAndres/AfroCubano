// deploy.js
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs-extra');

const DEPLOYMENT_FILE = '.clasp-deployment.json';

function run(command) {
    console.log(`→ ${command}`);
    return execSync(command, { stdio: 'inherit' });
}

function getSavedDeploymentId() {
    if (fs.existsSync(DEPLOYMENT_FILE)) {
        return fs.readJsonSync(DEPLOYMENT_FILE).deploymentId;
    }
    return null;
}

function saveDeploymentId(deploymentId) {
    fs.writeJsonSync(DEPLOYMENT_FILE, { deploymentId }, { spaces: 2 });
}

(async () => {
    try {
        run('clasp push');
        const deploymentId = getSavedDeploymentId();

        if (deploymentId) {
            // Actualizar deployment existente
            run(`clasp deploy --deploymentId ${deploymentId} --description "Main"`);
        } else {
            // Crear nueva implementación
            const output = execSync(`clasp deploy --description "Main"`).toString();
            const match = output.match(/Deployed (\S+) @(\d+)/);
            if (match) {
                saveDeploymentId(match[1]);
                console.log(`✔ Guardado deploymentId: ${match[1]}`);
            } else {
                throw new Error('No se pudo extraer el deployment ID.');
            }
        }

        // Mostrar URL del Web App
        console.log(`URL del Web App: https://script.google.com/macros/s/${deploymentId}/exec`);
    } catch (err) {
        console.error('❌ Error en el deploy:', err.message);
    }
})();
