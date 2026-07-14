import { axiosPostData } from './api'; // Import reusable axiosPostData function

export async function validateLogin(values) {
    let errors = {};

    // Simple email regex pattern to check for valid email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if email is empty or invalid
    if (!values.email) {
        errors.email = "Email should not be empty";
    } else if (!emailPattern.test(values.email)) {
        errors.email = "Invalid email format";
    }

    // Check if password is empty
    if (!values.password) {
        errors.password = "Password should not be empty";
    }

    // If email and password pass initial checks, send to the server for validation
    // if (values.email && emailPattern.test(values.email) && values.password) {
    //     try {
    //         const response = await axiosPostData('http://localhost:4000/login', {
    //             email: values.email,
    //             password: values.password
    //         });

    //         // If server responded with an error, update the password field with the error message
    //         if (response.error) {
    //             errors.password = response.error; // Display server error under password
    //         }

    //     } catch (error) {
    //         console.error("Error during login validation", error);
    //         errors.password = "Error connecting to server. Please try again later." + error;
    //     }
    // }

    return errors;
}
