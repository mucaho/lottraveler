const fsPromises = require('fs').promises;

const jestOpenAPI = require('jest-openapi');
jestOpenAPI(require('path').resolve('./openapi.json'));

const axios = require('axios').create({
  baseURL: 'http://localhost:8080'
});

const app = require('./app');
beforeAll(() => {
  return Promise.all([
    fsPromises.writeFile('kb-facts-test.lp', '', 'utf8'),
    app.open()
  ]);
});
afterAll(() => {
  return Promise.all([
    fsPromises.unlink('kb-facts-test.lp').catch(() => {}),
    app.close()
  ]);
});

function readKBFacts() {
  return fsPromises.readFile('kb-facts-test.lp', 'utf8');
}

function writeKBFacts(facts) {
  return fsPromises.writeFile('kb-facts-test.lp', facts, 'utf8');
}

describe('GET /getKnowledgeBase', () => {
  it('should properly retrieve the knowledge base', async () => {
    const firstKB = await axios.get('/getKnowledgeBase');
    expect(firstKB).toSatisfyApiSpec();
    expect(firstKB).toContainKeys(['data', 'status']);
    expect(firstKB.status).toEqual(200);

    expect(firstKB.data).toBeDefined();
    expect(firstKB.data).toBeObject();
    expect(firstKB.data).toContainAllKeys(['tasks', 'connections']);
    expect(firstKB.data.tasks).toBeDefined();
    expect(firstKB.data.tasks).toBeArray();
    expect(firstKB.data.connections).toBeDefined();
    expect(firstKB.data.connections).toBeArray();

    const secondKB = await axios.get('/getKnowledgeBase');
    expect(secondKB).toSatisfyApiSpec();
    expect(secondKB.data).toStrictEqual(firstKB.data);
    expect(secondKB.status).toEqual(200);
  });
});

describe('POST /updateKnowledgeBase', () => {
  it('should report errors for knowledge base not a directed acyclic graph', async () => {
    const originalKB = await axios.get('/getKnowledgeBase');
    const res = await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"}
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" },
          { "name": "has_successor", "transitive": true,  "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const newKB = await axios.get('/getKnowledgeBase');

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(kb_not_a_directed_acyclic_graph)",
        "description": "reason(kb_not_a_directed_acyclic_graph)",
      }]
    });
    expect(originalKB.data).toStrictEqual(newKB.data);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for inconsistent knowledge base', async () => {
    const originalKB = await axios.get('/getKnowledgeBase');
    const res = await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"}
      ],
      "connections": [
          { "name": "has_successor", "transitive": true,  "srcName": "XYZ", "dstName": "ivi" },
      ]
    });
    const newKB = await axios.get('/getKnowledgeBase');

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(kb_inconsistent)",
        "description": "reason(kb_inconsistent)",
      }]
    });
    expect(originalKB.data).toStrictEqual(newKB.data);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for updating with a consistent knowledge base', async () => {
    const originalKB = await axios.get('/getKnowledgeBase');
    expect(originalKB.data.tasks).toSatisfyAll(task => task.name !== "XYZ");

    const updatedKB = {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
          { "name": "XYZ", "repeatable": false, "group": "both"}
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    };
    const res = await axios.post('/updateKnowledgeBase', updatedKB);

    const newKB = await axios.get('/getKnowledgeBase');
    expect(newKB.data.tasks).not.toSatisfyAll(task => task.name !== "XYZ");

    expect(originalKB.data).not.toEqual(newKB.data);
    expect(originalKB.data).not.toEqual(updatedKB);
    expect(newKB.data).toStrictEqual(updatedKB);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });
});

describe('POST /validate', () => {
  it('should report no errors for trivial valid workflow', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"}
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["evi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for trivial invalid workflow', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"}
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(unknown_task)",
        "description": "reason(unknown_task)",
        "errorArg0": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for unknown task', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "ivi", "repeatable": false, "group": "both"}
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["XYZ"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(unknown_task)",
        "description": "reason(unknown_task)",
        "errorArg0": "task(\"XYZ\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating unrepeatable task', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "ivi", "repeatable": false, "group": "both"}
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(non_repeatable)",
        "description": "reason(non_repeatable)",
        "errorArg0": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for mixing tasks that can be both destructive and non-destructive', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for non-destructive before destructive tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "non-destructive"},
          { "name": "ivi", "repeatable": false, "group": "destructive"},
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for destructive before non-destructive tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "non-destructive"},
          { "name": "ivi", "repeatable": false, "group": "destructive"},
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(destructive_before_non_destructive_task)",
        "description": "reason(destructive_before_non_destructive_task)",
        "errorArg0": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for containing a mandatory successor task', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for missing mandatory successor task', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task)",
        "description": "reason(missing_mandatory_dependency_task)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for containing mandatory predecessor task', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for missing mandatory predecessor task', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task)",
        "description": "reason(missing_mandatory_dependency_task)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for respecting partial order between non-repeatable tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should automatically infer partial order from other connection types - has_predecessor', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(partial_order_violation)",
        "description": "reason(partial_order_violation)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should automatically infer partial order from other connection types - has_mandatory_predecessor', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi"]);

    expect(res.data.errors).toIncludeAllMembers([{
      "errorCode": "reason(partial_order_violation)",
      "description": "reason(partial_order_violation)",
      "errorArg0": "task(\"evi\")",
      "errorArg1": "task(\"ivi\")",
    }]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should automatically infer partial order from other connection types - has_mandatory_successor', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi"]);

    expect(res.data.errors).toIncludeAllMembers([{
      "errorCode": "reason(partial_order_violation)",
      "description": "reason(partial_order_violation)",
      "errorArg0": "task(\"evi\")",
      "errorArg1": "task(\"ivi\")",
    }]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for violating partial order between non-repeatable tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(partial_order_violation)",
        "description": "reason(partial_order_violation)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for respecting partial order between non-repeatable and repeatable tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for violating partial order between non-repeatable and repeatable tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(partial_order_violation)",
        "description": "reason(partial_order_violation)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for respecting partial order between repeatable and non-repeatable tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for violating partial order between repeatable and non-repeatable tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(partial_order_violation)",
        "description": "reason(partial_order_violation)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report no errors for repeating non-mandatory tasks in any order', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi", "evi", "ivi", "ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for repeating a task and its mandatory successor properly', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating a task more often than its mandatory successor at the end', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
          { "name": "XYZ", "repeatable": false, "group": "both"}
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task)",
        "description": "reason(missing_mandatory_dependency_task)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating a task more often than its mandatory successor in between', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating a task before its mandatory successor', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "evi", "ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for repeating a task and its mandatory predecessor properly', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating a task more often than its mandatory predecessor at the beginning', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task)",
        "description": "reason(missing_mandatory_dependency_task)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating a task more often than its mandatory predecessor in between', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating a task before its mandatory predecessor', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" }
      ]
    });
    const res = await axios.post('/validate', ["evi", "evi", "ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for repeating co-dependent tasks properly', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" },
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating one of the co-dependent tasks more often at the end', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" },
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi", "ivi", "evi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task)",
        "description": "reason(missing_mandatory_dependency_task)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for repeating one of the co-dependent tasks more often at the beginning', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" },
      ]
    });
    const res = await axios.post('/validate', ["ivi", "evi", "ivi", "evi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task)",
        "description": "reason(missing_mandatory_dependency_task)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for incorrectly repeating co-dependent tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "evi" },
      ]
    });
    const res = await axios.post('/validate', ["evi", "ivi", "evi", "evi", "ivi", "ivi"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for correctly repeating dependent tasks in a more complex example', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/validate', [
      "evi", "xray",
      "evi", "xray", "ivi",
      "xray",
      "evi", "xray", "ivi",
      "xray", "ivi"
    ]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for incorrectly repeating dependent tasks in a more complex example I', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/validate', [
      "evi",
      "evi", "xray", "ivi",
      "ivi"
    ]);

    expect(res.data.errors).toIncludeSameMembers([{
      "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "errorArg0": "task(\"evi\")",
      "errorArg1": "task(\"xray\")",
    }, {
      "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "errorArg0": "task(\"xray\")",
      "errorArg1": "task(\"ivi\")",
    }]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for incorrectly repeating dependent tasks in a more complex example II', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/validate', [
      "evi",
      "evi", "xray", "ivi",
      "xray", "ivi"
    ]);

    expect(res.data.errors).toIncludeSameMembers([{
      "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "errorArg0": "task(\"evi\")",
      "errorArg1": "task(\"xray\")",
    }]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for correctly repeating co-dependent tasks in a more complex example', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "xray", "dstName": "evj" },

          { "name": "has_mandatory_successor", "transitive": true, "srcName": "xray", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/validate', [
      "evi", "xray", "ivi",
      "evi", "xray", "ivi",
      "evi", "xray", "ivi",
    ]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for incorrectly repeating co-dependent tasks in a more complex example', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "xray", "dstName": "evi" },

          { "name": "has_mandatory_successor", "transitive": true, "srcName": "xray", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/validate', [
      "evi", "xray", "ivi",
      "evi", "xray", "ivi",
      "xray", "ivi",
    ]);

    expect(res.data.errors).toIncludeSameMembers([{
      "errorCode": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "description": "reason(missing_mandatory_dependency_task_between_repetitions)",
      "errorArg0": "task(\"evi\")",
      "errorArg1": "task(\"xray\")",
    }]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for respecting partial order between transitive tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "xray", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_successor", "transitive": true, "srcName": "xray", "dstName": "ivi" },
      ]
    });
    const res = await axios.post('/validate', [
      "evi", "ivi"
    ]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should not report errors for violating partial order between non-transitive tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "xray", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": false, "srcName": "evi", "dstName": "xray" },
          { "name": "has_successor", "transitive": false, "srcName": "xray", "dstName": "ivi" },
      ]
    });
    const res = await axios.post('/validate', [
      "ivi", "evi"
    ]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should report errors for violating partial order between transitive tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "xray", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_successor", "transitive": true, "srcName": "xray", "dstName": "ivi" },
      ]
    });
    const res = await axios.post('/validate', [
      "ivi", "evi"
    ]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(partial_order_violation)",
        "description": "reason(partial_order_violation)",
        "errorArg0": "task(\"evi\")",
        "errorArg1": "task(\"ivi\")",
      }]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });
});

describe('POST /repair', () => {
  it('should not repair trivial, valid workflow', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
      ],
      "connections": [
      ]
    });
    const res = await axios.post('/repair', ["evi"]);

    expect(res.data).toStrictEqual({
      errors: []
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should repair trivial, invalid workflow', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "sam", "repeatable": false, "group": "both"},
          { "name": "sample_preparation", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "sam", "dstName": "sample_preparation" }
      ]
    });
    const res = await axios.post('/repair', ["sample_preparation", "sam"]);

    expect(res.data).toStrictEqual({
      errors: [{
        "errorCode": "reason(partial_order_violation)",
        "description": "reason(partial_order_violation)",
        "errorArg0": "task(\"sam\")",
        "errorArg1": "task(\"sample_preparation\")",
      }],
      recommendation: [
        "sam", "sample_preparation"
      ]
    });
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should repair invalid workflow with missing mandatory tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "xray", "dstName": "evi" },

          { "name": "has_mandatory_successor", "transitive": true, "srcName": "xray", "dstName": "ivi" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/repair', ["xray", "xray", "xray"]);

    expect(res.data.recommendation).toStrictEqual([
      "evi", "xray", "ivi",
      "evi", "xray", "ivi",
      "evi", "xray", "ivi"
    ]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should repair invalid workflow with transitive mandatory tasks', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": true, "group": "both"},
          { "name": "xray", "repeatable": true, "group": "both"},
          { "name": "ivi", "repeatable": true, "group": "both"},
      ],
      "connections": [
          { "name": "has_mandatory_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "xray", "dstName": "evi" },

          { "name": "has_mandatory_predecessor", "transitive": true, "srcName": "ivi", "dstName": "xray" },
      ]
    });
    const res = await axios.post('/repair', ["ivi"]);

    expect(res.data.recommendation).toStrictEqual([
      "evi", "xray", "ivi"
    ]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });

  it('should repair invalid workflow with transitive partial order violations', async () => {
    await axios.post('/updateKnowledgeBase', {
      "tasks": [
          { "name": "evi", "repeatable": false, "group": "both"},
          { "name": "xray", "repeatable": false, "group": "both"},
          { "name": "ivi", "repeatable": false, "group": "both"},
      ],
      "connections": [
          { "name": "has_successor", "transitive": true, "srcName": "evi", "dstName": "xray" },
          { "name": "has_successor", "transitive": true, "srcName": "xray", "dstName": "ivi" },
      ]
    });
    const res = await axios.post('/repair', ["ivi", "evi"]);

    expect(res.data.recommendation).toStrictEqual([
      "evi", "ivi"
    ]);
    expect(res.status).toEqual(200);
    expect(res).toSatisfyApiSpec();
  });
});
