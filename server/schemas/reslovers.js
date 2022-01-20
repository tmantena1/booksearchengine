const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
	Query: {
		users: async () => {
			return User.find({});
		},
		books: async (parent, { username }) => {
			const user = User.findOne({ username }).populate("savedBooks");
			const { savedBooks } = user;
			return savedBooks;
		},
	},
	Mutation: {
		addUser: async (parent, { username, email, password }) => {
			const user = await User.create({ username, email, password });
			const token = signToken(user);
			return { token, user };
		},
		login: async (parent, { email, password }) => {
			const user = await User.findOne({ email });
			if (!user) {
				throw new AuthenticationError("Incorrect email or password!");
			}
			const correctPassword = user.isCorrectPassword(password);
			if (!correctPassword) {
				throw new AuthenticationError("Wrong signon credentials");
			}
			const token = signToken(user);
			return { token, user };
		},
		saveBook: async (parent, args, context) => {
			try {
				const addToUserBooks = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $addToSet: { savedBooks: args } },
					{ new: true, runValidators: true }
				);
				return addToUserBooks;
			} catch (e) {
				return `Unable to saveBook due to error: ${e}`;
			}
		},
		deleteBook: async (parent, args, context) => {
			try {
				const removeFromUserBooks = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $pull: { savedBooks: { bookId: args.bookId } } },
					{ new: true, runValidators: true }
				);
				return removeFromUserBooks;
			} catch (e) {
				return `Unable to deleteBook due to error: ${e}`;
			}
		},
	},
};

module.exports = resolvers;
