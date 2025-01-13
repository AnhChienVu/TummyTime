const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const mockData = require('./mockData/mockData');
const validatePassword = require('./utils/validatePassword');

const app = express();
const PORT = 8080;
const mockUser = {
  users: [
    {
      user_id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'password',
      role: 'Parent',
    },
  ],
};

app.use(express.json());
app.use(cors());

// GET "/" route for health check
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// POST "/login" route for logging in a user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find the user with the given email
  const user = mockUser.users.find((user) => user.email === email);

  // If the user is found and the password is correct, return a success message
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// POST /register route for registering a new user
app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role } =
    req.body;
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  if (mockUser.users.find((user) => user.email === email)) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res
      .status(400)
      .json({ success: false, message: passwordValidation.message });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: mockUser.users.length + 1,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
  };

  mockUser.users.push(newUser);

  return res.json({ success: true });
});

// PUT /users/:id route for updating a user
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password, role } = req.body;

  const userIndex = mockUser.users.findIndex((user) => user.user_id == id);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (password) {
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
      return res
        .status(400)
        .json({ success: false, message: passwordValidation.message });
    }
    mockUser.users[userIndex].password = await bcrypt.hash(password, 10);
  }

  mockUser.users[userIndex] = {
    ...mockUser.users[userIndex], // keep the existing user data
    firstName: firstName || mockUser.users[userIndex].firstName,
    lastName: lastName || mockUser.users[userIndex].lastName,
    email: email || mockUser.users[userIndex].email,
    role: role || mockUser.users[userIndex].role,
  };

  return res.json({ success: true, user: mockUser.users[userIndex] });
});

// DELETE /users/:id route for deleting a user
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  const userIndex = mockUser.users.findIndex((user) => user.user_id == id);

  if (userIndex === -1) {
    // if user not found from findIndex()
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // delete the user from the array and get the deleted user
  const deletedUser = mockUser.users.splice(userIndex, 1);

  return res.json({
    success: true,
    message: "User deleted",
    user: deletedUser,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
