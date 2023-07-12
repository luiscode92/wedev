const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { MongoClient, Db } = require('mongodb');

let db;

const connectToDB = async () => {
  if (db) {
    return db;
  }

  const client = await MongoClient.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
  db = client.db('test'); 

  return db;
};

const typeDefs = gql`
  type Todo {
    _id: ID
    item: String
    completed: Boolean
  }

  type Query {
    getTodos: [Todo]
  }

  type Mutation {
    createTodo(item: String!, completed: Boolean!): Todo
  }
`;

const resolvers = {
  Query: {
    getTodos: async () => {
      const db = await connectToDB();
      const collection = db.collection('todos');
      return collection.find({}).toArray();
    },
  },
  Mutation: {
    createTodo: async (_, { item, completed }) => {
      const db = await connectToDB();
      const collection = db.collection('todos');
      const result = await collection.insertOne({ item, completed });
     
      return {
        _id: result.insertedId, 
        item,
        completed
      };
    },
  },
  
  
};



//server init

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();

(async () => {
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
})();



/**
 * 
 * {"query": "query { getTodos { _id item completed } }"}
 * 
 * {"query": "mutation { createTodo(item: \"Test Todo\", completed: false) { _id item completed } }"}
 * 
 */