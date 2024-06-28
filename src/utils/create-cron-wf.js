import fs from 'fs';
import yaml from 'js-yaml'

function createCronWf(schedule){
    // read and load yaml template
    const yaml_file = fs.readFileSync("src/yaml_templates/cron-wf.yaml", "utf8");
    const yaml_data = yaml.load(yaml_file);

    // modify value
    yaml_data.spec.schedule = schedule

    // write cron wf
    const new_yaml_data = yaml.dump(yaml_data)
    return new_yaml_data
}

export { createCronWf };