import fs from 'fs';
import yaml from 'js-yaml'

function createGetFilesWfTemplates(database, host, port, databasename, username, password, query, timezone, timeout){
    // read and load yaml template
    const yaml_file = fs.readFileSync("src/yaml_templates/read-psql-output.yaml", "utf8");
    const yaml_data = yaml.load(yaml_file);

    // modify template
    yaml_data.spec.activeDeadlineSeconds = timeout

    let reader = ''
    if (database === 'postgresql') {
        reader = 'postgresqlreader'
        yaml_data.spec.templates[1].script.image = 'ssuntoso/datax:postgresql-txt'
    } else if (database === 'mysql') {
        reader = 'mysqlreader'
        yaml_data.spec.templates[1].script.image = 'ssuntoso/datax:mysql-txt'
    } else if (database === 'oracle') {
        reader = 'oraclereader'
        yaml_data.spec.templates[1].script.image = 'ssuntoso/datax:oracle-txt'
    } else {
        return 'Invalid database'
    }

    yaml_data.spec.templates[1].script.source = 'lastruntime=$(cat /tmp/lastruntime.txt)\n' +
        'lastsuccessruntime=$(cat /tmp/lastsuccessruntime.txt)\n' +
        '\n' +
        'lastrun=$(date -d "${lastruntime:0:10} ${lastruntime:11:-3}" +%s)\n' +
        'lastsuccess=$(date -d "${lastsuccessruntime:0:10} ${lastsuccessruntime:11:-3}" +%s)\n' +
        'currenttime=$(date -u +"%FT%T+00")\n' +
        '\n' +
        'mkdir /opt/datax/src/result/\n' +
        '\n' +
        '# Check if there are running workflow and run datax if lestruntime > lastsuccessruntime\n' +
        'if [ $lastrun -gt $lastsuccess ] \n' +
        'then\n' +
        '  echo "There are running workflow"\n' +
        '  echo "noData" > /opt/datax/src/result/output.csv\n' +
        '  echo 0 > /tmp/meta-row.txt\n' +
        'else \n' +
        `  reader="${reader}"\n` +
        `  where="timestamp >= '$lastruntime' AND timestamp < '$currenttime'"\n` +
        `  query="\\"${query} WHERE $where\\""\n` +
        `  timezone="${timezone}"\n` +
        `  jdbcUrl="jdbc:${database}://${host}:${port}/${databasename}"\n` +
        `  username="${username}"\n` +
        '\n' +
        '  python3 /opt/datax/bin/datax.py -p" -Duser.timezone=$timezone -DreaderName=$reader -Dusername=username -Dpassword=$PASSWORD -DquerySql=$query -DjdbcUrl=$jdbcUrl" /opt/datax/src/config/config.json\n' +
        '\n' +
        '  cd /opt/datax/src/result/\n' +
        '  expr $(wc -l < $(ls)) - 1 > /tmp/meta-row.txt\n' +
        'fi\n' +
        '\n' +
        '# check if there are new data\n' +
        'if [ $(cat /tmp/meta-row.txt) -eq 0 ]; then\n' +
        '  echo $lastruntime > /tmp/currenttime.txt\n' +
        'else \n' +
        '  echo $currenttime > /tmp/currenttime.txt\n' +
        'fi\n',
    
    yaml_data.spec.templates[1].script.env[0].valueFrom.secretKeyRef.name = `'${password}'`

    // write wf
    const new_yaml_data = yaml.dump(yaml_data)
    return new_yaml_data
}

export { createGetFilesWfTemplates }