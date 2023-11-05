import { useState } from "react";
import { axiosInstance } from "../axios.Config";
import { useEffect } from "react";
import { useMemo } from "react";
import debouce from "lodash.debounce";

const Todolist = () => {
  const [todos, setTodos] = useState([]);
  const [taskNameFromState, setTaskNameFromState] = useState("");

  const getAllData = () => {
    axiosInstance.get("/todos").then((res) => {
      console.log(res.data);
      setTodos(res.data);
    });
  };

  useEffect(() => {
    getAllData();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    // console.log(taskNameFromState);
    axiosInstance
      .post("/todos", {
        taskName: taskNameFromState,
        isCompleted: false,
      })
      .then(() => getAllData());
    setTaskNameFromState("");
  };

  const handleChange = (e) => {
    setTaskNameFromState(e.target.value);
  };

  const handleEdit = (content) => {
    content.isCompleted = false;
    axiosInstance
      .patch(`/todos/${content.id}`, content)
      .then(() => getAllData());
  };

  const handleDone = (status) => {
    status.isCompleted = true;
    axiosInstance.patch(`/todos/${status.id}`, status).then(() => getAllData());
  };

  const handleDelete = (id) => {
    axiosInstance.delete(`/todos/${id}`).then(() => {
      getAllData();
    });
    // console.log(id);
  };

  const handleSearch = (e) => {
    axiosInstance
      .get(`/todos?q=${e.target.value}`)
      .then((res) => setTodos(res.data));
  };

  const debouncedResults = useMemo(() => {
    return debouce(handleSearch, 500);
  }, []);
  /*////////////////////////////////////////////////////////////////*/
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers["Authorization"] = "Bearer " + token;
      }
      config.headers["Content-Type"] = "application/json";
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );
  /*////////////////////////////////////////////////////////////////*/
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async function (error) {
      const originalRequest = error.config;

      if (
        error.response.status === 401 &&
        originalRequest.url === "http://localhost:3000/auth/token"
      ) {
        return Promise.reject(error);
      }

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = "xxxxxxxxxx";
        const res = await axiosInstance.post("/auth/token", {
          refresh_token: refreshToken,
        });
        if (res.status === 201) {
          localStorage.setItem("auth_token", res.data);
          axiosInstance.defaults.headers.common["Authorization"] =
            "Bearer " + localStorage.getItem("auth_token");
          return axiosInstance(originalRequest);
        }
      }
      return Promise.reject(error);
    }
  );
  /*////////////////////////////////////////////////////////////////*/

  return (
    <div className="todolist">
      <div className="search" onSubmit={addTask}>
        <input
          type="text"
          placeholder="Search ex: todo 1"
          onChange={debouncedResults}
        />
      </div>

      <form className="addTask" onSubmit={addTask}>
        <input
          type="text"
          value={taskNameFromState}
          onChange={handleChange}
          placeholder="Add a task........"
        />
        <button className="addtask-btn">Add Task</button>
      </form>

      <div className="lists">
        {todos?.map((todo, id) => (
          <div
            key={id}
            className={`list ${todo.isCompleted ? "completed" : ""}`}
          >
            <p> {todo.taskName}</p>
            <div className="span-btns">
              {!todo.isCompleted && (
                <span onClick={() => handleDone(todo)} title="completed">
                  ✓
                </span>
              )}
              <span
                className="delete-btn"
                onClick={() => handleDelete(todo.id)}
                title="delete"
              >
                x
              </span>
              <span
                className="edit-btn"
                onClick={() => handleEdit(todo)}
                title="edit"
              >
                ↻
              </span>
            </div>
          </div>
        ))}
        {!todos?.length && <h1>No Records</h1>}
      </div>
    </div>
  );
};

export default Todolist;
