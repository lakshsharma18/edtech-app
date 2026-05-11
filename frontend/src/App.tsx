
import { Routes } from "react-router-dom"
import { Route } from "react-router-dom"
import NavigationBar from "./components/Navbar"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Login from "./pages/Login"
function App() {
  

  return (
    <>
     <NavigationBar/>
     <Routes>
      <Route path="/" element={<Home/>}></Route>
      <Route path="/register" element = {<Register/>}></Route>
      <Route path="/login" element = {<Login/>}></Route>
     </Routes>
    </>
  )
}

export default App
