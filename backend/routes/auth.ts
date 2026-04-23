router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);

  try {
    const user = await User.findOne({ username }).populate('labId');
    console.log('User found?', !!user);

    if (user) {
      console.log('DB username:', user.username);
      console.log('DB password hash:', user.password);
      console.log('Password match:', bcrypt.compareSync(password, user.password || ''));
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!bcrypt.compareSync(password, user.password || '')) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        labId: user.labId?._id
      },
      JWT_SECRET
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        labId: user.labId?._id
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'A server error occurred during login.' });
  }
});