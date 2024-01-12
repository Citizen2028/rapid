describe('actionAddMember', function() {
    it('adds an member to a relation at the specified index', function() {
        var r = Rapid.osmRelation({members: [{id: '1'}, {id: '3'}]});
        var g = Rapid.actionAddMember(r.id, {id: '2'}, 1)(new Rapid.Graph([r]));
        expect(g.entity(r.id).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
    });

    describe('inserts way members at a sensible index', function() {
        function members(graph) {
            return graph.entity('r').members.map(function (m) { return m.id; });
        }

        it('handles incomplete relations', function () {
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmNode({id: 'd', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                Rapid.osmWay({id: '=', nodes: ['c','d']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = Rapid.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['~', '-', '=']);
        });

        it('adds the member to a relation with no members', function() {
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b']}),
                Rapid.osmRelation({id: 'r'})
            ]);

            graph = Rapid.actionAddMember('r', {id: '-', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-']);
        });

        it('appends the member if the ways are not connecting', function() {
            // Before:  a ---> b
            // After:   a ---> b .. c ===> d
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmNode({id: 'd', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b']}),
                Rapid.osmWay({id: '=', nodes: ['c', 'd']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = Rapid.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=']);
        });

        it('appends the member if the way connects at end', function() {
            // Before:   a ---> b
            // After:    a ---> b ===> c
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b']}),
                Rapid.osmWay({id: '=', nodes: ['b', 'c']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = Rapid.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=']);
        });

        it('inserts the member if the way connects at beginning', function() {
            // Before:          b ---> c ~~~> d
            // After:    a ===> b ---> c ~~~> d
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmNode({id: 'd', loc: [0, 0]}),
                Rapid.osmWay({id: '=', nodes: ['a', 'b']}),
                Rapid.osmWay({id: '-', nodes: ['b', 'c']}),
                Rapid.osmWay({id: '~', nodes: ['c', 'd']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            graph = Rapid.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['=', '-', '~']);
        });

        it('inserts the member if the way connects in middle', function() {
            // Before:  a ---> b  ..  c ~~~> d
            // After:   a ---> b ===> c ~~~> d
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmNode({id: 'd', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b']}),
                Rapid.osmWay({id: '=', nodes: ['b', 'c']}),
                Rapid.osmWay({id: '~', nodes: ['c', 'd']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            graph = Rapid.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=', '~']);
        });

        it('inserts the member multiple times if insertPair provided (middle)', function() {
            // Before:  a ---> b  ..  c ~~~> d <~~~ c  ..  b <--- a
            // After:   a ---> b ===> c ~~~> d <~~~ c <=== b <--- a
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmNode({id: 'd', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b']}),
                Rapid.osmWay({id: '=', nodes: ['b', 'c']}),
                Rapid.osmWay({id: '~', nodes: ['c', 'd']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'}
                ]})
            ]);

            var member = { id: '=', type: 'way' };
            var insertPair = {
                originalID: '-',
                insertedID: '=',
                nodes: ['a','b','c']
            };
            graph = Rapid.actionAddMember('r', member, undefined, insertPair)(graph);
            expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
        });

        it('inserts the member multiple times if insertPair provided (beginning/end)', function() {
            // Before:         b <=== c ~~~> d <~~~ c ===> b
            // After:   a <--- b <=== c ~~~> d <~~~ c ===> b ---> a
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmNode({id: 'd', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['b', 'a']}),
                Rapid.osmWay({id: '=', nodes: ['c', 'b']}),
                Rapid.osmWay({id: '~', nodes: ['c', 'd']}),
                Rapid.osmRelation({id: 'r', members: [
                    {id: '=', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '=', type: 'way'}
                ]})
            ]);

            var member = { id: '-', type: 'way' };
            var insertPair = {
                originalID: '=',
                insertedID: '-',
                nodes: ['c','b','a']
            };
            graph = Rapid.actionAddMember('r', member, undefined, insertPair)(graph);
            expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
        });

        it('keeps stops and platforms ordered before node, way, relation (for PTv2 routes)', function() {
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [0, 0]}),
                Rapid.osmNode({id: 'c', loc: [0, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b']}),
                Rapid.osmWay({id: '=', nodes: ['b', 'c']}),
                Rapid.osmRelation({id: 'r', members: [
                    { id: 'n1', type: 'node', role: 'stop' },
                    { id: 'w1', type: 'way', role: 'platform' },
                    { id: 'n2', type: 'node', role: 'stop_entry_only' },
                    { id: 'w2', type: 'way', role: 'platform_entry_only' },
                    { id: 'n3', type: 'node', role: 'stop_exit_only' },
                    { id: 'w3', type: 'way', role: 'platform_exit_only' },
                    { id: 'n10', type: 'node', role: 'forward' },
                    { id: 'n11', type: 'node', role: 'forward' },
                    { id: '-', type: 'way', role: 'forward' },
                    { id: 'r1', type: 'relation', role: 'forward' },
                    { id: 'n12', type: 'node', role: 'forward' }
                ]})
            ]);

            graph = Rapid.actionAddMember('r', { id: '=', type: 'way', role: 'forward' })(graph);
            expect(graph.entity('r').members).to.eql([
                { id: 'n1', type: 'node', role: 'stop' },
                { id: 'w1', type: 'way', role: 'platform' },
                { id: 'n2', type: 'node', role: 'stop_entry_only' },
                { id: 'w2', type: 'way', role: 'platform_entry_only' },
                { id: 'n3', type: 'node', role: 'stop_exit_only' },
                { id: 'w3', type: 'way', role: 'platform_exit_only' },
                { id: 'n10', type: 'node', role: 'forward' },
                { id: 'n11', type: 'node', role: 'forward' },
                { id: 'n12', type: 'node', role: 'forward' },
                { id: '-', type: 'way', role: 'forward' },
                { id: '=', type: 'way', role: 'forward' },
                { id: 'r1', type: 'relation', role: 'forward' }
            ]);
        });

    });
});
