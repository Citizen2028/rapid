describe('actionMoveNode', function () {
    it('changes a node\'s location', function () {
        var node = Rapid.osmNode({id: 'a', loc: [0, 0]});
        var toLoc = [2, 3];
        var graph = new Rapid.Graph([node]);

        graph = Rapid.actionMoveNode('a', toLoc)(graph);
        expect(graph.entity('a').loc).to.eql(toLoc);
    });

    describe('transitions', function () {
        it('is transitionable', function() {
            expect(Rapid.actionMoveNode().transitionable).to.be.true;
        });

        it('move node at t = 0', function() {
            var node = Rapid.osmNode({id: 'a', loc: [0, 0]});
            var toLoc = [2, 3];
            var graph = new Rapid.Graph([node]);

            graph = Rapid.actionMoveNode('a', toLoc)(graph, 0);
            expect(graph.entity('a').loc[0]).to.be.closeTo(0, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(0, 1e-6);
        });

        it('move node at t = 0.5', function() {
            var node = Rapid.osmNode({id: 'a', loc: [0, 0]});
            var toLoc = [2, 3];
            var graph = new Rapid.Graph([node]);

            graph = Rapid.actionMoveNode('a', toLoc)(graph, 0.5);
            expect(graph.entity('a').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(1.5, 1e-6);
        });

        it('move node at t = 1', function() {
            var node = Rapid.osmNode({id: 'a', loc: [0, 0]});
            var toLoc = [2, 3];
            var graph = new Rapid.Graph([node]);

            graph = Rapid.actionMoveNode('a', toLoc)(graph, 1);
            expect(graph.entity('a').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('a').loc[1]).to.be.closeTo(3, 1e-6);
        });
    });
});
