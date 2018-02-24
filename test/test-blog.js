const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker')
const mongoose = require('mongoose');

chai.use(chaiHttp);
const expect = chai.expect;

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');


function createBlogPost(){
	const blogPost =  {
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		title: faker.lorem.words(),
		content: faker.lorem.paragraph(),
		// created: faker.date.past(),
	};
	return blogPost
}
function seedBlogData(){
	// console.info('seeding blogpost data')
	const seedData = [];
	for (let i=0; i<10; i++){
		seedData.push(createBlogPost())
	}
	return BlogPost.insertMany(seedData); //promise
}
function tearDownDb(){
	// console.warn('deleting database')
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

	const expectedKeys = ['author', 'title', 'content', 'created', 'id'];
	describe('GET endpoint', function(){
		it('should return all posts w correct fields', function(){
			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res){
					res = _res;
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.length.of.at.least(1)
					return BlogPost.count();
				})
				.then(function(count){
					expect(res.body.length).to.equal(count)
					res.body.forEach(post=>{
						expect(post).to.include.keys(expectedKeys)
					})
				})
		});
		it('should return a single requested post w correct fields', function(){
			let post = '';
			return chai.request(app)
				.get('/posts')
				.then(function(res){
					post = res.body[0]
					return chai.request(app)
						.get(`/posts/${post.id}`)
				})
				.then(function(res){
					expect(res.body).to.include.keys(expectedKeys);
					expect(res.body.id).to.equal(post.id)
				})
		});	
	});
	describe('POST endpoint', function(){
		let preCount;
		const newPost = createBlogPost();

		it('should create a new blog post', function(){
			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res){
					expect(res).to.have.status(201)
					expect(res).to.be.json;
					expect(res.body).to.be.an('object')
					expect(res.body).to.include.keys(expectedKeys)
					expect(res.body.id).to.not.be.null;
					newPost.id = res.body.id;
					expect(res.body.title).to.equal(newPost.title)
					expect(res.body.content).to.equal(newPost.content)
					// expect(res.body.created).to.equal(newPost.created) //changed format
					expect(res.body.id).to.equal(newPost.id)
					return BlogPost.findById(res.body.id)
				})
				.then(function(mongoPost){
					expect(mongoPost.title).to.equal(newPost.title)
					expect(mongoPost.content).to.equal(newPost.content)
				})
		})
	});
	describe('PUT endpoint', function(){
		it('should update a blog post w new info', function(){
			let origPost;
			let id;
			const postUpdates = {  title: 'new title', 
				author: {firstName: 'abe', lastName: 'lincoln'}
			}
			return BlogPost.findOne()
				.then(function(res){
					postUpdates.id = res.id
					origPost = res;
					return chai.request(app)
						.put(`/posts/${res.id}`)
						.send(postUpdates)
				})
				.then(function(res){
					expect(res).to.have.status(204)
					return BlogPost.findById(postUpdates.id)
				})
				.then(function(newPost){
					expect(newPost.title).to.equal(postUpdates.title)
					expect(newPost.author.firstName).to.equal(postUpdates.author.firstName)
					expect(newPost.author.lastName).to.equal(postUpdates.author.lastName)
					// content was NOT updated
					expect(newPost.content).to.equal(origPost.content)
				})
		})
		it('should not allow update without id in body', function(){
			const badUpdate = {content: 'I have no id'}
			const goodUpdate = {content: 'i have an id'}
			return BlogPost.findOne()
				.then(function(blogpost){
					goodUpdate.id = blogpost.serialize().id
					return chai.request(app)
						.put(`/posts/${blogpost.serialize().id}`)
						.send(badUpdate)
				})
				.then(function(res){
					expect(res).to.have.status(400)
					console.log('hello there');
				})
				.catch(err=> {
					expect(err)
				})

		})
	});
	describe('DELETE endpoint', function(){
		it('should delete a given post', function(){
			let blogpost;
			return BlogPost
				.findOne()
				.then(function(_blogpost){
					blogpost = _blogpost;
					return chai.request(app)
						.delete(`/posts/${blogpost.id}`);
				})
				.then(function(res){
					expect(res).to.have.status(204);
					return BlogPost.findById(blogpost.id)
				})
				.then(function(_blogpost){
					expect(_blogpost).to.be.null
				})
		})
	});




}) // end describe blog posts resource