import { prisma } from '../../prisma/prisma';
const bcrypt = require('bcrypt');
// TODO: Make sure status codes align with message i.e. 404 not found, 400 bad request etc

async function validateEmail(email) {
    if (!email.includes('@')) {
        return false;
    }
    if (await prisma.user.findUnique({
        where: {
            email: email
        }
    })) {
        return false;
    } 
    return true;
}

function validatePassword(password, passwordConfirm) {
    return password.length >= 8 && password === passwordConfirm; // NOTE: Consider checking for capital leters, and symbols
}

async function handler(req, res) {
    if (req.method === 'POST') {
        const email = req.body.email;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const password = req.body.password;
        const passwordConfirm = req.body.passwordConfirm;
        const phone = req.body.phone;

        if (!email || !firstName || !lastName || !password || !passwordConfirm || !phone) {
            return res.status(400).json({message: 'Please fill all fields'}); // Highlight missing ones in red?
        }

        if (!validateEmail(email)) {
            return res.status(404).json({
                message: "Email is not valid or already in use." // NOTE: Consider splitting these
            })
        }

        if (!validatePassword(password, passwordConfirm)) {
            return res.status(404).json({
                message: "Password is not at minimum 8 characters or doesn't match." // NOTE: Consider splitting these
            })
        }

        if (await prisma.user.findUnique({ phoneNum: phone})) {
            return res.status(404).json({
                message: "Phone number is already in use."
            })
        }
        
        try {

            const hashed_password = await bcrypt.hash(password, 10);

            // Create User
            let user = await prisma.user.create({
                data: {
                    email: email,
                    password: hashed_password,
                    firstName: firstName,
                    lastName: lastName,
                    phoneNum: phone
                }
            });
            return res.status(200).json({message: 'User created successfully', user: user});

        } catch (error) {
            return res.status(500).json({message: error});
        }

    } else {
        return res.status(405).json({message: 'Method not allowed'});
    }

}


export default handler;