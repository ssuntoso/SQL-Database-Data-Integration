import fs from 'fs';
import yaml from 'js-yaml'

function createUploadFilesWfTemplates(endpoint, method, key, headers, retryStrategy, processInOrder=false){
    // read and load yaml template
    const yaml_file = fs.readFileSync("src/yaml_templates/psql-read-write-template.yaml", "utf8");
    const yaml_data = yaml.load(yaml_file);

    // modify template
    if (processInOrder) {
        yaml_data.spec.templates[0].parallelism = 1
    }

    let curl = `curl -X ${method} ${endpoint} \\\n` 
    curl += `  -H "Authorization: ${key}" \\\n`
    headers.map(header => {
        curl += `  -H "${header.name}: ${header.value}" \\\n`
    })
    curl += `  -F "file=@{{inputs.parameters.file}}" \\\n`
    curl += `  -w '%{http_code}' > /tmp/status-code.txt \\\n`
    curl += `  -o /tmp/response.txt \n`
    
    yaml_data.spec.templates[2].script.source='cd /tmp/json\n' +
      '\n' +
      curl +
      '\n' +
      'statusCode=$(cat /tmp/status-code.txt)\n' +
      'if [ $statusCode -gte 400 ]; then\n' +
      '  echo "API call failed with status code $statusCode"\n' +
      '  exit 1\n' +
      'fi\n' +
      '\n' +
      'cat /tmp/response.txt\n' +
      '\n' +
      'echo "{{node.name}}"\n' +
      'echo "{{workflow.name}}"\n' +
      'echo "{{node.name}}" > /tmp/node-name.txt\n'
    
    yaml_data.spec.templates[2].retryStrategy = retryStrategy

    // write cron wf
    const new_yaml_data = yaml.dump(yaml_data)
    return new_yaml_data
}

export { createUploadFilesWfTemplates }