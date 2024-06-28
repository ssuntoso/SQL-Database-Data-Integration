import fs from 'fs';
import { createCronWf } from './utils/create-cron-wf.js';
import { createGetFilesWfTemplates } from './utils/create-get-files-wf-template.js';
import { createUploadFilesWfTemplates } from './utils/create-upload-files-wf-templates.js';

const config_file_path = process.argv[2];

fs.readFile(config_file_path, 'utf8', (err, data) => {
    if (err) {
        console.log("Error reading config file:", err);
        return;
    }

    const path = process.argv[3]

    try {
        const config_data = JSON.parse(data).Workflow
        const cron_wf = createCronWf(config_data.Trigger.JDBCInput.Config.Schedule)
        const get_file_wf = createGetFilesWfTemplates(
            config_data.Trigger.JDBCInput.Config.Database,
            config_data.Trigger.JDBCInput.Config.Hostname,
            config_data.Trigger.JDBCInput.Config.Port,
            config_data.Trigger.JDBCInput.Config.DatabaseName,
            config_data.Trigger.JDBCInput.Config.Username,
            config_data.Trigger.JDBCInput.Config.Password,
            config_data.Trigger.JDBCInput.Config.Query,
            config_data.Trigger.JDBCInput.Config.Timezone,
            config_data.Trigger.JDBCInput.Config.Timeout,
        )

        const upload_file_wf = createUploadFilesWfTemplates(
            config_data.Trigger.States.DataUpload.Config.ApiEndpoint,
            config_data.Trigger.States.DataUpload.Config.Method,
            config_data.Trigger.States.DataUpload.Config.ApiKey,
            config_data.Trigger.States.DataUpload.Config.headers,
            config_data.Trigger.States.DataUpload.Config.retryStrategy,
            config_data.Trigger.JDBCInput.Config.ProcessInOrder,
        )

        fs.writeFileSync(`${path}/datax-cron-wf.yaml`, cron_wf)
        fs.writeFileSync(`${path}/datax-get-files-wf-template.yaml`, get_file_wf)
        fs.writeFileSync(`${path}/datax-upload-files-wf-template.yaml`, upload_file_wf)

    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
})