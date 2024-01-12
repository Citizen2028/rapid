describe('osmChangeset', function () {
    it('returns a changeset', function () {
        expect(Rapid.osmChangeset()).to.be.an.instanceOf(Rapid.osmChangeset);
        expect(Rapid.osmChangeset().type).to.equal('changeset');
    });

    it('defaults tags to an empty object', function () {
        expect(Rapid.osmChangeset().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(Rapid.osmChangeset({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });


    describe('#asJXON', function () {
        it('converts a node to jxon', function() {
            var node = Rapid.osmChangeset({tags: {'comment': 'hello'}});
            expect(node.asJXON()).to.eql({
                osm: {
                    changeset: {
                        tag: [{ '@k': 'comment', '@v': 'hello' }],
                        '@version': 0.6,
                        '@generator': 'Rapid'
                    }
                }
            });
        });
    });


    describe('#osmChangeJXON', function() {
        it('converts change data to JXON', function() {
            var changeset = Rapid.osmChangeset();
            var jxon = changeset.osmChangeJXON({ created: [], modified: [], deleted: [] });

            expect(jxon).to.eql({
                osmChange: {
                    '@version': 0.6,
                    '@generator': 'Rapid',
                    'create': {},
                    'modify': {},
                    'delete': { '@if-unused': true }
                }
            });
        });

        it('includes creations ordered by nodes, ways, relations', function() {
            var n = Rapid.osmNode({ loc: [0, 0] });
            var w = Rapid.osmWay();
            var r = Rapid.osmRelation();
            var c = Rapid.osmChangeset({ id: '1234' });
            var changes = { created: [r, w, n], modified: [], deleted: [] };
            var jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.create;
            expect(result.node).to.eql([n.asJXON('1234').node]);
            expect(result.way).to.eql([w.asJXON('1234').way]);
            expect(result.relation).to.eql([r.asJXON('1234').relation]);
        });

        it('includes creations ordered by dependencies', function() {
            var n = Rapid.osmNode({ loc: [0, 0] });
            var w = Rapid.osmWay({nodes: [n.id]});
            var r1 = Rapid.osmRelation({ members: [{ id: w.id, type: 'way' }] });
            var r2 = Rapid.osmRelation({ members: [{ id: r1.id, type: 'relation' }] });
            var c = Rapid.osmChangeset({ id: '1234' });
            var changes = { created: [r2, r1, w, n], modified: [], deleted: [] };
            var jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.create;
            expect(result.node).to.eql([n.asJXON('1234').node]);
            expect(result.way).to.eql([w.asJXON('1234').way]);
            expect(result.relation).to.eql([r1.asJXON('1234').relation, r2.asJXON('1234').relation]);
        });

        it('includes creations ignoring circular dependencies', function() {
            var r1 = Rapid.osmRelation();
            var r2 = Rapid.osmRelation();
            var c = Rapid.osmChangeset({ id: '1234' });
            var changes, jxon;
            r1.addMember({ id: r2.id, type: 'relation' });
            r2.addMember({ id: r1.id, type: 'relation' });
            changes = { created: [r1,r2], modified: [], deleted: [] };
            jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.create;
            expect(result.relation).to.eql([r1.asJXON('1234').relation, r2.asJXON('1234').relation]);
        });

        it('includes modifications', function() {
            var n = Rapid.osmNode({ loc: [0, 0] });
            var w = Rapid.osmWay();
            var r = Rapid.osmRelation();
            var c = Rapid.osmChangeset({ id: '1234' });
            var changes = { created: [], modified: [r, w, n], deleted: [] };
            var jxon = c.osmChangeJXON(changes);

            expect(jxon.osmChange.modify).to.eql({
                node: [n.asJXON('1234').node],
                way: [w.asJXON('1234').way],
                relation: [r.asJXON('1234').relation]
            });
        });

        it('includes deletions ordered by relations, ways, nodes', function() {
            var n = Rapid.osmNode({ loc: [0, 0] });
            var w = Rapid.osmWay();
            var r = Rapid.osmRelation();
            var c = Rapid.osmChangeset({ id: '1234' });
            var changes = { created: [], modified: [], deleted: [n, w, r] };
            var jxon = c.osmChangeJXON(changes);

            var result = jxon.osmChange.delete;
            expect(result.node).to.eql([n.asJXON('1234').node]);
            expect(result.way).to.eql([w.asJXON('1234').way]);
            expect(result.relation).to.eql([r.asJXON('1234').relation]);
            expect(result['@if-unused']).to.eql(true);
        });
    });

});
