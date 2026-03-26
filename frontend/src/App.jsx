import { BrowserRouter,Routes,Route } from "react-router-dom"
import Table from "./pages/Table"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import Login from "./pages/Login"
import History from "./pages/History"
import Register from "./pages/Register"
import ProtectedRoute from "./components/ProtectedRoute"

function App(){

return(

<BrowserRouter>

<Routes>

<Route path="/table/:restaurantId/:tableNumber" element={<Table/>} />
<Route 
path="/dashboard"
element={
<ProtectedRoute>
<Dashboard/>
</ProtectedRoute>
}
/>
<Route 
path="/admin"
element={
<ProtectedRoute roleRequired="admin">
<Admin/>
</ProtectedRoute>
}
/>
<Route path="/login" element={<Login/>}/>
<Route path="/history" element={<History/>}/>
<Route path="/register" element={<Register />} />

</Routes>

</BrowserRouter>

)

}

export default App