process.env.npm_package_config_ONTOLOGY_PREFIX = '<http://community.infineon.com/sites/smart-FA-lab/Semantic%20Search/FAOntologyV5#>';
process.env.npm_package_config_FUSEKI_URI = 'http://127.0.0.1:3030/FAOntology';
process.env.npm_package_config_FUSEKI_AUTH = 'Basic YWRtaW46YWRtaW4=';

const connectionTypes = require('./../ConnectionTypes').all;

async function main () {
  await test_query_tasks_methods();
  await test_query_tasks();
  await test_query_connections();

  await test_update_task_names();

  await test_delete_connections();
  await test_delete_tasks();

  await test_insert_tasks();
  await test_insert_connections();
}

async function test_query_tasks_methods() {
  const { createQuery, rowAccFn } = require('./query_tasks_methods');
  const query = createQuery();

  console.log('test_query_tasks_methods')
  console.log()

  // console.log(await query)
  const tasks = await require('./query')(await query, rowAccFn);
  console.dir(tasks);

  console.log('end')
  console.log()
}

async function test_query_tasks() {
  const { createQuery, rowAccFn } = require('./query_tasks');
  const query = createQuery();

  console.log('test_query_tasks')
  console.log()

  // console.log(await query)
  const tasks = await require('./query')(await query, rowAccFn);
  console.dir(tasks);

  console.log('end')
  console.log()
}

async function test_query_connections() {
  const { createQuery, rowAccFn } = require('./query_connections');
  const query = createQuery();

  console.log('test_query_connections')
  console.log()

  // console.log(await query)
  const connections = await require('./query')(await query, rowAccFn);
  console.dir(connections);

  console.log('end')
  console.log()
}

async function test_update_task_names() {
  const updateSubjects = require('./update_subject_tasks')
    ({importedName: 'EVI', name: 'EVI2'});
  const updateObjects = require('./update_object_tasks')
    ({importedName: 'EVI', name: 'EVI2'});

  console.log('test_update_task_names')
  console.log()

  // console.log(await updateSubjects + ';' + await updateObjects)
  await require('./update')(await updateSubjects, await updateObjects);

  console.log('end')
  console.log()
}

async function test_delete_tasks() {
  const updateSubjects = require('./delete_subject_tasks.js')
    ({name: 'XRAY'});
  const updateObjects = require('./delete_object_tasks.js')
    ({name: 'XRAY'});

  console.log('test_delete_tasks')
  console.log()

  // console.log(await updateSubjects + ';' + await updateObjects)
  await require('./update')(await updateSubjects, await updateObjects);

  console.log('end')
  console.log()
}

async function test_delete_connections() {
  const updateConnections = require('./delete_connections.js')(...connectionTypes);

  console.log('test_delete_connections')
  console.log()

  // console.log(await updateConnections)
  await require('./update')(await updateConnections)

  console.log('end')
  console.log()
}

async function test_insert_tasks() {
  const insertTasks = require('./insert_tasks.js')(
    {name: 'XRAY', group: 'non-destructive', repeatable: false},
    {name: 'EVI', group: 'non-destructive', repeatable: false}
  );

  console.log('test_insert_tasks')
  console.log()

  // console.log(await insertTasks)
  await require('./update')(await insertTasks)

  console.log('end')
  console.log()
}

async function test_insert_connections() {
  const insertConnections = require('./insert_connections.js')
    ({srcName: 'XRAY', name: 'has_predecessor', dstName: 'EVI', transitive: false});

  console.log('test_insert_connections')
  console.log()

  // console.log(await insertConnections)
  await require('./update')(await insertConnections)

  console.log('end')
  console.log()
}

// const rdf = require('rdf-ext')
// const SparqlClient = require('sparql-http-client')

// const local = new SparqlClient({
//   storeUrl: 'http://localhost:3030/FAOntology/data',
//   factory: rdf
// })

// async function main () {
//   const stream = await local.store.get(rdf.defaultGraph())

//   stream.on('data', quad => {
//     console.log(`${quad.subject} ${quad.predicate} ${quad.object}`)
//   })
// }

main()
