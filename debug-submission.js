const fetch = require('node-fetch');

async function testSubmissionFlow() {
  const baseUrl = 'http://localhost:4000';
  
  // Test data
  const testContent = {
    essay: '<p>This is a test essay submission with <strong>rich text</strong> content.</p>',
    file_upload: [],
    quiz: {},
    project: '',
    discussion: '',
    presentation: '',
    code_submission: '',
    peer_review: ''
  };

  console.log('🧪 Testing Submission Flow...\n');

  try {
    // 1. Test creating a submission
    console.log('1️⃣ Creating submission...');
    const createResponse = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_STUDENT_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify({
        assignment_id: '167023be-7638-4659-b3c5-702668c88fcc',
        content: testContent,
        response: testContent.essay
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Create failed:', createResponse.status, errorText);
      return;
    }

    const createdSubmission = await createResponse.json();
    console.log('✅ Created submission:', JSON.stringify(createdSubmission, null, 2));

    // 2. Test retrieving the submission
    console.log('\n2️⃣ Retrieving submission...');
    const getResponse = await fetch(`${baseUrl}/api/submissions/${createdSubmission.id}`, {
      headers: {
        'Authorization': 'Bearer YOUR_STUDENT_TOKEN_HERE' // Replace with actual token
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.log('❌ Get failed:', getResponse.status, errorText);
      return;
    }

    const retrievedSubmission = await getResponse.json();
    console.log('✅ Retrieved submission:', JSON.stringify(retrievedSubmission, null, 2));

    // 3. Check content structure
    console.log('\n3️⃣ Content Analysis:');
    console.log('Original content.essay:', testContent.essay);
    console.log('Retrieved content.essay:', retrievedSubmission.content?.essay);
    console.log('Retrieved response:', retrievedSubmission.response);
    console.log('Content keys:', Object.keys(retrievedSubmission.content || {}));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSubmissionFlow();
