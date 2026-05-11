
import {Routes,Route} from 'react-router-dom'
import NavigationBar from './components/Navbar'
import Register from './pages/Register'
import Home from './pages/Home'
function App() {
  

  return (
    <>
      <NavigationBar/>
      <Routes>
        <Route path='/' element = {<Home/>}></Route>
        <Route path='/register' element = {<Register/>}></Route>
      </Routes>
    </>
  )
}

export default App
