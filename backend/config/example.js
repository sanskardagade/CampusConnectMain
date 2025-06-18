const sql = require("./neonsetup");

async function getAllUsers() {
  try {
    // Fetch all users from the database
    const users = await sql`
      SELECT * FROM users
    `;
    
    // Print the results
    console.log('All Users:');
    console.log('-------------------');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log('-------------------');
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Execute the function
getAllUsers();