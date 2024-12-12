const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const SECRET_KEY = "your-secret-key";
app.use(cors());
app.use(bodyParser.json());

let users = []; // 사용자 데이터 저장
let todos = []; // 할 일 리스트 저장

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요." });
  }

  if (users.find((user) => user.username === username)) {
    return res.status(400).json({ error: "이미 존재하는 아이디입니다." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword };
  users.push(newUser);
  res.status(201).json({ message: "회원가입이 완료되었습니다." });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(400).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json({ token, message: "로그인이 성공적으로 완료되었습니다." });
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "권한이 없습니다." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "권한이 없습니다." });
  }
};

// 할 일 목록 가져오기
app.get("/todos", authenticate, (req, res) => {
  const userTodos = todos
    .filter((todo) => todo.username === req.user.username)
    .sort((a, b) => b.priority - a.priority || new Date(a.dueDate) - new Date(b.dueDate));
  res.json(userTodos);
});

// 할 일 추가
app.post("/todos", authenticate, (req, res) => {
  const { title, priority, dueDate } = req.body;

  if (!title || !priority || !dueDate) {
    return res.status(400).json({ error: "제목, 우선순위, 마감일을 모두 입력해주세요." });
  }

  const newTodo = {
    id: Date.now(),
    username: req.user.username,
    title,
    priority: parseInt(priority, 10),
    dueDate,
    completed: false,
  };
  todos.push(newTodo);

  console.log("Sending newTodo:", newTodo); // 로그로 데이터 확인
  res.status(201).json(newTodo);
});


// 할 일 수정
app.put("/todos/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { title, priority, dueDate } = req.body;

  const todoIndex = todos.findIndex((todo) => todo.id === parseInt(id) && todo.username === req.user.username);

  if (todoIndex === -1) {
    return res.status(404).json({ error: "해당 할 일을 찾을 수 없습니다." });
  }

  if (!title || !priority || !dueDate) {
    return res.status(400).json({ error: "제목, 우선순위, 마감일을 모두 입력해주세요." });
  }

  todos[todoIndex] = { ...todos[todoIndex], title, priority: parseInt(priority, 10), dueDate };
  res.json(todos[todoIndex]);
});

// 할 일 삭제
app.delete("/todos/:id", authenticate, (req, res) => {
  const { id } = req.params;

  todos = todos.filter((todo) => todo.id !== parseInt(id));
  res.sendStatus(200);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
});
