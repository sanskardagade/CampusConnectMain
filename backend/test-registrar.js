const sql = require('./config/neonsetup');
const RegistrarModel = require('./models/Registrar');

async function testRegistrarFunctionality() {
  try {
    console.log('🧪 Testing Registrar Functionality...\n');

    // Test 1: Create a test registrar
    console.log('1. Creating test registrar...');
    const testRegistrar = await RegistrarModel.create({
      erpid: 'REG001',
      name: 'Test Registrar',
      email: 'registrar@test.com',
      password: 'TestRegistrar@123'
    });
    console.log('✅ Test registrar created:', testRegistrar.name);

    // Test 2: Find registrar by ERP ID
    console.log('\n2. Finding registrar by ERP ID...');
    const foundRegistrar = await RegistrarModel.findByErp('REG001');
    if (foundRegistrar) {
      console.log('✅ Registrar found:', foundRegistrar.name);
    } else {
      console.log('❌ Registrar not found');
    }

    // Test 3: Test password comparison
    console.log('\n3. Testing password comparison...');
    const isValidPassword = await RegistrarModel.comparePassword('TestRegistrar@123', foundRegistrar.passwordHash);
    console.log('✅ Password comparison result:', isValidPassword);

    // Test 4: Update registrar profile
    console.log('\n4. Updating registrar profile...');
    const updatedRegistrar = await RegistrarModel.update('REG001', {
      name: 'Updated Test Registrar',
      email: 'updated.registrar@test.com'
    });
    console.log('✅ Profile updated:', updatedRegistrar.name);

    // Test 5: Update password
    console.log('\n5. Updating password...');
    const passwordUpdated = await RegistrarModel.updatePassword('REG001', 'NewPassword@123');
    console.log('✅ Password updated:', passwordUpdated ? 'Success' : 'Failed');

    // Test 6: Test new password
    console.log('\n6. Testing new password...');
    const newRegistrar = await RegistrarModel.findByErp('REG001');
    const isNewPasswordValid = await RegistrarModel.comparePassword('NewPassword@123', newRegistrar.passwordHash);
    console.log('✅ New password comparison result:', isNewPasswordValid);

    // Test 7: Generate password reset token
    console.log('\n7. Generating password reset token...');
    const resetToken = await RegistrarModel.generatePasswordResetToken('updated.registrar@test.com');
    console.log('✅ Reset token generated:', resetToken ? 'Success' : 'Failed');

    // Test 8: Reset password with token
    if (resetToken) {
      console.log('\n8. Resetting password with token...');
      const resetResult = await RegistrarModel.resetPassword(resetToken.token, 'ResetPassword@123');
      console.log('✅ Password reset result:', resetResult ? 'Success' : 'Failed');
    }

    // Test 9: Deactivate registrar
    console.log('\n9. Deactivating registrar...');
    const deactivatedRegistrar = await RegistrarModel.deactivate('REG001');
    console.log('✅ Registrar deactivated:', deactivatedRegistrar ? 'Success' : 'Failed');

    // Test 10: Verify deactivation
    console.log('\n10. Verifying deactivation...');
    const inactiveRegistrar = await RegistrarModel.findByErp('REG001');
    console.log('✅ Inactive registrar found:', inactiveRegistrar ? 'No (should be null)' : 'Yes (correct)');

    console.log('\n🎉 All registrar tests completed successfully!');
    console.log('\n📝 Note: You may want to clean up the test data from the database.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the tests
testRegistrarFunctionality(); 