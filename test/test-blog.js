const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');
const faker = require('faker')

const mongoose = require('mongoose');

function createBlogPost(){
	const blogPost =  {
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		title: faker.lorem.words(),
		content: faker.lorem.paragraph(),
		created: faker.date.past(),
	};
	return blogPost
}
function seedBlogData(){
	console.info('seeding blogpost data')
	const seedData = [];
	for (let i=0; i<10; i++){
		seedData.push(createBlogPost())
	}
	return BlogPost.insertMany(seedData); //promise
}
function tearDownDb(){
	console.warn('deleting database')
	return mongoose.connection.dropDatabase();
}

describe('BlogPosts resource', function(){
	before(function(){
		return runServer(TEST_DATABASE_URL);
	});
	beforeEach(function(){
		return seedBlogData();
	});
	afterEach(function(){
		return tearDownDb();
	});
	after(function(){
		return closeServer();
	});

	describe('GET endpoint', function(){
		it('should return all posts w correct fields', function(){});
		it('should return a single post with correct fields', function(){});	
	});
	describe('POST endpoint', function(){
		it('should create a new blog post', function(){})
	});
	describe('PUT endpoint', function(){
		it('should update a blog post w new info', function(){})
	});
	describe('DELETE endpoint', function(){
		it('should delete a given post', function(){})
	});




}) // end describe blog posts resource