export function validateSignup(values) {
    let error = {};

    // Email pattern that ensures the email ends with @mavs.uta.edu
    // const email_pattern = /^[^@\s]+@mavs\.uta\.edu$/;

    // Password pattern to ensure password contains at least one digit, one lowercase letter, one uppercase letter, one special character, and is at least 8 characters long
    // const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[a-zA-Z0-9\W_]{8,}$/;

    // Phone number pattern (allows only numbers, typically 10 digits)
    // const phone_pattern = /^[0-9]{10}$/;

    // Validate First Name
    if (!values.firstName) {
        error.firstName = "First name should not be empty";
    } else {
        error.firstName = "";
    }

    // Validate Last Name
    if (!values.lastName) {
        error.lastName = "Last name should not be empty";
    } else {
        error.lastName = "";
    }

    // Validate Phone Number
    if (!values.phone) {
        error.phone = "Phone number should not be empty";
    // } else if (!phone_pattern.test(values.phone)) {
    //     error.phone = "Phone number should be 10 digits";
    } else {
        error.phone = "";
    }

    // Validate Email
    if (!values.email) {
        error.email = "Email should not be empty";
    // } else if (!email_pattern.test(values.email)) {
    //     error.email = "Email should end with @mavs.uta.edu";
    } else {
        error.email = "";
    }

    // Validate Password
    if (!values.password) {
        error.password = "Password should not be empty";
    // } else if (!password_pattern.test(values.password)) {
    //     error.password = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    } else {
        error.password = "";
    }

    // Validate Student ID
    if (!values.studentID) {
        error.studentID = "Student ID should not be empty";
    } else {
        error.studentID = "";
    }
    
    return error;
}
