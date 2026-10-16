import React from 'react'

const Login = () => {
	const handleGoogleResponse = async (response) => {
		const { data } = await axios.post(
			`${backendUrl}/api/user/google-login`,
			{
				credential: response.credential
			},
			{
				withCredentials: true
			}
		)
	}
	return <div>Login</div>
}

export default Login
