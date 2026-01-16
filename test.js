const http = require('http');

// const BASE_URL = 'http://localhost:3000';
const BASE_URL = 'http://192.168.4.37:30301';
let testCustomerId = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('\n🧪 Starting API Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: GET /info
  try {
    console.log('Test 1: GET /info');
    const response = await makeRequest('GET', '/info');

    if (response.statusCode === 200 &&
        response.body['service-instance'] &&
        response.body['service-info'] &&
        response.headers['x-service-instance'] &&
        response.headers['x-service-info']) {
      console.log('✅ PASSED - Info endpoint returns correct data and headers');
      console.log(`   Instance: ${response.body['service-instance']}`);
      console.log(`   Info: ${response.body['service-info']}`);
      passed++;
    } else {
      console.log('❌ FAILED - Info endpoint response invalid');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 2: GET /customers (empty list)
  try {
    console.log('\nTest 2: GET /customers (should be empty initially)');
    const response = await makeRequest('GET', '/customers');

    if (response.statusCode === 200 && Array.isArray(response.body)) {
      console.log('✅ PASSED - Get all customers returns array');
      console.log(`   Count: ${response.body.length}`);
      passed++;
    } else {
      console.log('❌ FAILED - Get all customers failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 3: POST /customers (create)
  try {
    console.log('\nTest 3: POST /customers (create new customer)');
    const newCustomer = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };
    const response = await makeRequest('POST', '/customers', newCustomer);

    if (response.statusCode === 201 &&
        response.body.id &&
        response.body.name === newCustomer.name &&
        response.body.email === newCustomer.email) {
      testCustomerId = response.body.id;
      console.log('✅ PASSED - Customer created successfully');
      console.log(`   ID: ${response.body.id}`);
      console.log(`   Name: ${response.body.name}`);
      console.log(`   Email: ${response.body.email}`);
      passed++;
    } else {
      console.log('❌ FAILED - Customer creation failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 4: GET /customers/:id (read single)
  try {
    console.log('\nTest 4: GET /customers/:id (get customer by ID)');
    const response = await makeRequest('GET', `/customers/${testCustomerId}`);

    if (response.statusCode === 200 &&
        response.body.id === testCustomerId &&
        response.body.name === 'John Doe') {
      console.log('✅ PASSED - Customer retrieved by ID');
      console.log(`   ID: ${response.body.id}`);
      console.log(`   Name: ${response.body.name}`);
      passed++;
    } else {
      console.log('❌ FAILED - Get customer by ID failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 5: GET /customers (list with data)
  try {
    console.log('\nTest 5: GET /customers (should contain created customer)');
    const response = await makeRequest('GET', '/customers');

    if (response.statusCode === 200 &&
        Array.isArray(response.body) &&
        response.body.length > 0) {
      console.log('✅ PASSED - Customer list contains data');
      console.log(`   Count: ${response.body.length}`);
      passed++;
    } else {
      console.log('❌ FAILED - Customer list is invalid');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 6: PUT /customers/:id (update)
  try {
    console.log('\nTest 6: PUT /customers/:id (update customer)');
    const updatedCustomer = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com'
    };
    const response = await makeRequest('PUT', `/customers/${testCustomerId}`, updatedCustomer);

    if (response.statusCode === 200 &&
        response.body.id === testCustomerId &&
        response.body.name === updatedCustomer.name &&
        response.body.email === updatedCustomer.email) {
      console.log('✅ PASSED - Customer updated successfully');
      console.log(`   ID: ${response.body.id}`);
      console.log(`   Name: ${response.body.name}`);
      console.log(`   Email: ${response.body.email}`);
      passed++;
    } else {
      console.log('❌ FAILED - Customer update failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 7: DELETE /customers/:id
  try {
    console.log('\nTest 7: DELETE /customers/:id (delete customer)');
    const response = await makeRequest('DELETE', `/customers/${testCustomerId}`);

    if (response.statusCode === 204) {
      console.log('✅ PASSED - Customer deleted successfully');
      passed++;
    } else {
      console.log('❌ FAILED - Customer deletion failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 8: GET /customers/:id (verify deletion)
  try {
    console.log('\nTest 8: GET /customers/:id (verify customer is deleted)');
    const response = await makeRequest('GET', `/customers/${testCustomerId}`);

    if (response.statusCode === 404) {
      console.log('✅ PASSED - Customer not found (correctly deleted)');
      passed++;
    } else {
      console.log('❌ FAILED - Customer still exists after deletion');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 9: POST /customers (missing fields)
  try {
    console.log('\nTest 9: POST /customers (validation - missing fields)');
    const invalidCustomer = {
      name: 'Test User'
      // missing email
    };
    const response = await makeRequest('POST', '/customers', invalidCustomer);

    if (response.statusCode === 400) {
      console.log('✅ PASSED - Validation error for missing fields');
      passed++;
    } else {
      console.log('❌ FAILED - Should return 400 for missing fields');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 10: PUT /customers/:id (non-existent customer)
  try {
    console.log('\nTest 10: PUT /customers/:id (update non-existent customer)');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const updateData = {
      name: 'Test',
      email: 'test@example.com'
    };
    const response = await makeRequest('PUT', `/customers/${fakeId}`, updateData);

    if (response.statusCode === 404) {
      console.log('✅ PASSED - Returns 404 for non-existent customer');
      passed++;
    } else {
      console.log('❌ FAILED - Should return 404 for non-existent customer');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 11: DELETE /customers/:id (non-existent customer)
  try {
    console.log('\nTest 11: DELETE /customers/:id (delete non-existent customer)');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await makeRequest('DELETE', `/customers/${fakeId}`);

    if (response.statusCode === 404) {
      console.log('✅ PASSED - Returns 404 for non-existent customer');
      passed++;
    } else {
      console.log('❌ FAILED - Should return 404 for non-existent customer');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Test 12: Check custom headers on all requests
  try {
    console.log('\nTest 12: Verify custom headers (x-service-instance, x-service-info)');
    const response = await makeRequest('GET', '/health');

    if (response.headers['x-service-instance'] &&
        response.headers['x-service-info']) {
      console.log('✅ PASSED - Custom headers present on all responses');
      console.log(`   x-service-instance: ${response.headers['x-service-instance']}`);
      console.log(`   x-service-info: ${response.headers['x-service-info']}`);
      passed++;
    } else {
      console.log('❌ FAILED - Custom headers missing');
      failed++;
    }
  } catch (e) {
    console.log('❌ FAILED - ' + e.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest('GET', '/health');
    console.log('✓ Server is running');
    return true;
  } catch (e) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   npm start');
    console.error('');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
})();
