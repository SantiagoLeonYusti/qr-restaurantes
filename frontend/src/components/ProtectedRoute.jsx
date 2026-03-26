import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children, roleRequired }) {

const restaurantId = localStorage.getItem("restaurant_id")
const role = localStorage.getItem("role")

if(!restaurantId){
return <Navigate to="/login"/>
}

if(roleRequired && role !== roleRequired){
return <Navigate to="/dashboard"/>
}

return children

}