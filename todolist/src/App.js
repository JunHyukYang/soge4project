import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const PriorityList = ({ todos, priorityLabel, deleteTodo, enableEditMode, editTodo, getPriorityLabel, formatDate }) => {
  return (
    <div className="priority-list">
      <h2>{priorityLabel}</h2>
      <div className="todo-items">
        {todos.map((todo) => (
          <div key={todo.id} className="todo-item">
            {todo.isEditing ? (
              <>
                <input
                  type="text"
                  value={todo.title}
                  onChange={(e) => (todo.title = e.target.value)}
                />
                <input
                  type="datetime-local"
                  value={todo.dueDate}
                  onChange={(e) => (todo.dueDate = e.target.value)}
                />
                <button
                  onClick={() =>
                    editTodo(todo.id, todo.title, todo.priority, todo.dueDate)
                  }
                >
                  저장
                </button>
              </>
            ) : (
              <>
                <span>
                  {todo.title} - {formatDate(todo.dueDate)}
                </span>
                <button onClick={() => enableEditMode(todo.id)}>수정</button>
              </>
            )}
            <button onClick={() => deleteTodo(todo.id)}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState("1");
  const [dueDate, setDueDate] = useState("");

  const resetInputs = () => {
    setUsername("");
    setPassword("");
  };

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/signup", {
        username,
        password,
      });
      alert(response.data.message);
      resetInputs();
    } catch (error) {
      alert(error.response.data.error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      setToken(response.data.token);
      setIsLoggedIn(true);
      alert(response.data.message);
      resetInputs();
      fetchTodos(response.data.token);
    } catch (error) {
      alert(error.response.data.error);
    }
  };

  const fetchTodos = async (authToken) => {
    try {
      const response = await axios.get("http://localhost:5000/todos", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTodos(
        response.data.map((todo) => ({
          ...todo,
          isEditing: false,
        }))
      );
    } catch (error) {
      alert("할 일을 불러오지 못했습니다.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken("");
    setTodos([]);
    resetInputs();
    alert("로그아웃되었습니다.");
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !priority || !dueDate) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const formattedDueDate = new Date(dueDate).toISOString();
      const response = await axios.post(
        "http://localhost:5000/todos",
        { title: newTodo, priority, dueDate: formattedDueDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Received from server:", response.data);
      setTodos((prevTodos) => {
        const updatedTodos = [...prevTodos, { ...response.data, isEditing: false }];
        console.log("Updated todos:", updatedTodos); // 상태 업데이트 후 확인
        return updatedTodos;
      });

      setNewTodo("");
      setPriority("1");
      setDueDate("");
    } catch (error) {
      console.error("Error adding todo:", error);
      alert("할 일을 추가하지 못했습니다.");
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      alert("할 일을 삭제하지 못했습니다.");
    }
  };

  const enableEditMode = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isEditing: true } : { ...todo, isEditing: false }
      )
    );
  };

  const editTodo = async (id, newTitle, newPriority, newDueDate) => {
    if (!newTitle.trim() || !newPriority || !newDueDate) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/todos/${id}`,
        { title: newTitle, priority: newPriority, dueDate: newDueDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...response.data, isEditing: false } : todo
        )
      );
    } catch (error) {
      alert("할 일을 수정하지 못했습니다.");
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 3:
        return "높음";
      case 2:
        return "중간";
      case 1:
      default:
        return "낮음";
    }
  };

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return parsedDate.toLocaleString("ko-KR", options);
  };

  const todosByPriority = {
    high: todos.filter((todo) => todo.priority === 3), // 숫자로 비교
    medium: todos.filter((todo) => todo.priority === 2),
    low: todos.filter((todo) => todo.priority === 1),
  };

  console.log("Filtered todos by priority:", todosByPriority); // 필터링 확인

  return (
    <div className="App">
      <h1>To-Do List 관리 시스템</h1>

      {!isLoggedIn ? (
        <div>
          <div className="form-switch">
            <button
              onClick={() => {
                setIsLoginForm(true);
                resetInputs();
              }}
              className={isLoginForm ? "active" : ""}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setIsLoginForm(false);
                resetInputs();
              }}
              className={!isLoginForm ? "active" : ""}
            >
              회원가입
            </button>
          </div>

          {isLoginForm ? (
            <div>
              <h2>로그인</h2>
              <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleLogin}>로그인</button>
            </div>
          ) : (
            <div>
              <h2>회원가입</h2>
              <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleSignup}>회원가입</button>
            </div>
          )}
        </div>
      ) : (
        <div>
     
          <button onClick={handleLogout}>로그아웃</button>
          <div className="input-container">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="할 일을 입력하세요"
            />
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="1">우선 순위 낮음</option>
              <option value="2">우선 순위 중간</option>
              <option value="3">우선 순위 높음</option>
            </select>
            <button onClick={addTodo}>추가</button>
          </div>

          <div className="priority-lists">
            <PriorityList
              todos={todosByPriority.high}
              priorityLabel="우선 순위 높음"
              deleteTodo={deleteTodo}
              enableEditMode={enableEditMode}
              editTodo={editTodo}
              formatDate={formatDate}
              getPriorityLabel={getPriorityLabel}
            />
            <PriorityList
              todos={todosByPriority.medium}
              priorityLabel="우선 순위 중간"
              deleteTodo={deleteTodo}
              enableEditMode={enableEditMode}
              editTodo={editTodo}
              formatDate={formatDate}
              getPriorityLabel={getPriorityLabel}
            />
            <PriorityList
              todos={todosByPriority.low}
              priorityLabel="우선 순위 낮음"
              deleteTodo={deleteTodo}
              enableEditMode={enableEditMode}
              editTodo={editTodo}
              formatDate={formatDate}
              getPriorityLabel={getPriorityLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;