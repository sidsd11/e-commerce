import axios from 'axios'
import { createContext } from 'react'

export const AppContext = createContext()

export const AppContextProvider = (props) => {
	axios.defaults.withCredentials = true

	const backendUrl = import.meta.env.VITE_BACKEND_URL

	const value = {
		backendUrl
	}
	return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
}
