'use strict';

module.exports = function (dbType, context) {

  describe(dbType + ': ltgt with limit', function () {
    it('gt query return correct number of docs', function () {
      var db = context.db;
      var index = {
        "index": {
          "fields": ["number"]
        },
        "name": "number-index",
        "type": "json"
      };

      return db.createIndex(index).then(function () {
        return db.bulkDocs([
          { _id: '0', number: 0 },
          { _id: '1', number: 1 }
        ]);
      }).then(function () {
        return db.find({
          selector: { number: { $gt: -1 } },
          limit: 1
        });
      }).then(function (resp) {
        var docs = resp.docs.map(function (x) { delete x._rev; return x; });
        docs.should.deep.equal([
          { _id: '0', number: 0 }
        ]);
      });
    });

    it('#20 - lt queries with sort descending return correct number of docs', function () {
      var db = context.db;
      var index = {
        "index": {
          "fields": ["debut"]
        },
        "name": "foo-index",
        "type": "json"
      };

      return db.createIndex(index).then(function () {
        return db.bulkDocs([
          { _id: '1', debut: 1983},
          { _id: '2', debut: 1981},
          { _id: '3', debut: 1989},
          { _id: '4', debut: 1990}
        ]);
      }).then(function () {
        return db.find({
          selector: {debut: {$lt: 1990}},
          sort: [{debut: 'desc'}],
          limit: 1
        });
      }).then(function (resp) {
        var docs = resp.docs.map(function (x) { delete x._rev; return x; });
        docs.should.deep.equal([
          { _id: '3', debut: 1989}
        ]);
      });
    });
    // ltge - {include_docs: true, reduce: false, descending: true, startkey: 1990}
    // lt no sort {include_docs: true, reduce: false, endkey: 1990, inclusive_end: false}
    // lt sort {include_docs: true, reduce: false, descending: true, 
    // startkey: 1990, inclusive_start: false}

    it('#38 $gt with dates', function () {
      var db = context.db;

      var startDate = "2015-05-25T00:00:00.000Z";
      var endDate = "2015-05-26T00:00:00.000Z";

      return db.createIndex({
        index: {
          fields: ['docType', 'logDate']
        }
      }).then(function () {
        return db.bulkDocs([
          {_id: '1', docType: 'log', logDate: "2015-05-24T00:00:00.000Z"},
          {_id: '2', docType: 'log', logDate: "2015-05-25T00:00:00.000Z"},
          {_id: '3', docType: 'log', logDate: "2015-05-26T00:00:00.000Z"},
          {_id: '4', docType: 'log', logDate: "2015-05-27T00:00:00.000Z"}
        ]);
      }).then(function() {
        return db.find({
          selector: {docType: 'log'}
        }).then(function (result) {
          result.docs.map(function (x) { delete x._rev; return x; }).should.deep.equal([
            {
              "_id": "1",
              "docType": "log",
              "logDate": "2015-05-24T00:00:00.000Z"
            },
            {
              "_id": "2",
              "docType": "log",
              "logDate": "2015-05-25T00:00:00.000Z"
            },
            {
              "_id": "3",
              "docType": "log",
              "logDate": "2015-05-26T00:00:00.000Z"
            },
            {
              "_id": "4",
              "docType": "log",
              "logDate": "2015-05-27T00:00:00.000Z"
            }
          ], 'test 1');
        });
      }).then(function () {
        return db.find({
          selector: {docType: 'log', logDate: {$gt: startDate}},
          limit: 1
        }).then(function (result) {
          result.docs.map(function (x) { delete x._rev; return x; }).should.deep.equal([
            {
              "_id": "3",
              "docType": "log",
              "logDate": "2015-05-26T00:00:00.000Z"
            }
          ], 'test 2');
        });
      }).then(function () {
        return db.find({
          selector: {docType: 'log', logDate: {$gte: startDate}},
          limit: 1
        }).then(function (result) {
          result.docs.map(function (x) { delete x._rev; return x; }).should.deep.equal([
            {
              "_id": "2",
              "docType": "log",
              "logDate": "2015-05-25T00:00:00.000Z"
            }
          ], 'test 3');
        });
      }).then(function () {
        return db.find({
          selector: {
            docType: 'log',
            logDate: {$gte: startDate, $lte: endDate}
          },
          limit: 1
        }).then(function (result) {
          result.docs.map(function (x) { delete x._rev; return x; }).should.deep.equal([
            {
              "_id": "2",
              "docType": "log",
              "logDate": "2015-05-25T00:00:00.000Z"
            }
          ], 'test 4');
        });
      });
    });

    it('bunch of equivalent queries', function () {
      var db = context.db;

      function normalize(res) {
        return res.docs.map(function getId(x) {
          return x._id;
        }).sort();
      }

      return db.createIndex({
        index: {
          fields: ['foo']
        }
      }).then(function () {
        return db.bulkDocs([
          {_id: '1', foo: 1},
          {_id: '2', foo: 2},
          {_id: '3', foo: 3},
          {_id: '4', foo: 4}
        ]);
      }).then(function() {
        return db.find({
          selector: { $and: [{foo: {$gt: 2}}, {foo: {$gte: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['3']);
        return db.find({
          selector: { $and: [{foo: {$eq: 2}}, {foo: {$gte: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['2']);
        return db.find({
          selector: { $and: [{foo: {$eq: 2}}, {foo: {$lte: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['2']);
        return db.find({
          selector: { $and: [{foo: {$lte: 3}}, {foo: {$lt: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$eq: 4}}, {foo: {$gte: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['4']);
        return db.find({
          selector: { $and: [{foo: {$lte: 3}}, {foo: {$eq: 1}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$eq: 4}}, {foo: {$gt: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['4']);
        return db.find({
          selector: { $and: [{foo: {$lt: 3}}, {foo: {$eq: 1}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
      });
    });

    it('bunch of equivalent queries 2', function () {
      var db = context.db;

      function normalize(res) {
        return res.docs.map(function getId(x) {
          return x._id;
        }).sort();
      }

      return db.createIndex({
        index: {
          fields: ['foo']
        }
      }).then(function () {
        return db.bulkDocs([
          {_id: '1', foo: 1},
          {_id: '2', foo: 2},
          {_id: '3', foo: 3},
          {_id: '4', foo: 4}
        ]);
      }).then(function() {
        return db.find({
          selector: { $and: [{foo: {$gt: 2}}, {foo: {$gte: 1}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['3']);
        return db.find({
          selector: { $and: [{foo: {$lt: 3}}, {foo: {$lte: 4}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$gt: 2}}, {foo: {$gte: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['3']);
        return db.find({
          selector: { $and: [{foo: {$lt: 3}}, {foo: {$lte: 1}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$gte: 2}}, {foo: {$gte: 1}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['2']);
        return db.find({
          selector: { $and: [{foo: {$lte: 3}}, {foo: {$lte: 4}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$gt: 2}}, {foo: {$gt: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['4']);
        return db.find({
          selector: { $and: [{foo: {$lt: 3}}, {foo: {$lt: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
      });
    });

    it('bunch of equivalent queries 3', function () {
      var db = context.db;

      function normalize(res) {
        return res.docs.map(function getId(x) {
          return x._id;
        }).sort();
      }

      return db.createIndex({
        index: {
          fields: ['foo']
        }
      }).then(function () {
        return db.bulkDocs([
          {_id: '1', foo: 1},
          {_id: '2', foo: 2},
          {_id: '3', foo: 3},
          {_id: '4', foo: 4}
        ]);
      }).then(function() {
        return db.find({
          selector: { $and: [{foo: {$gte: 1}}, {foo: {$gt: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['3']);
        return db.find({
          selector: { $and: [{foo: {$lte: 4}}, {foo: {$lt: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$gte: 3}}, {foo: {$gt: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['3']);
        return db.find({
          selector: { $and: [{foo: {$lte: 1}}, {foo: {$lt: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$gte: 1}}, {foo: {$gte: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['2']);
        return db.find({
          selector: { $and: [{foo: {$lte: 4}}, {foo: {$lte: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
        return db.find({
          selector: { $and: [{foo: {$gt: 3}}, {foo: {$gt: 2}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['4']);
        return db.find({
          selector: { $and: [{foo: {$lt: 2}}, {foo: {$lt: 3}}]},
          limit: 1
        });
      }).then(function (res) {
        normalize(res).should.deep.equal(['1']);
      });
    });

  });
};
