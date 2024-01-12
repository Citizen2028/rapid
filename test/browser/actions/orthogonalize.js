describe('actionOrthogonalize', function () {
    var projection = {
        project: function (val) { return val; },
        invert: function (val) { return val; }
    };

    describe('closed paths', function () {
        it('orthogonalizes a perfect quad', function () {
            //    d --- c
            //    |     |
            //    a --- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(5);
        });

        it('orthogonalizes a quad', function () {
            //    d --- c
            //    |     |
            //    a ---  b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(5);
        });

        it('orthogonalizes a triangle', function () {
            //    a
            //    | \
            //    |   \
            //     b - c
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 3]}),
                Rapid.osmNode({id: 'b', loc: [0.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [3, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(4);
        });

        it('deletes empty redundant nodes', function() {
            //    e - d - c
            //    |       |
            //    a ----- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [1, 2]}),
                Rapid.osmNode({id: 'e', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.hasEntity('d')).to.eq(undefined);
        });

        it('preserves non empty redundant nodes', function() {
            //    e - d - c
            //    |       |
            //    a ----- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [1, 2], tags: {foo: 'bar'}}),
                Rapid.osmNode({id: 'e', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(6);
            expect(graph.hasEntity('d')).to.not.eq(undefined);
        });

        it('only moves nodes which are near right or near straight', function() {
            //    f - e
            //    |    \
            //    |     d - c
            //    |         |
            //    a -------- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [3.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [3, 1]}),
                Rapid.osmNode({id: 'd', loc: [2, 1]}),
                Rapid.osmNode({id: 'e', loc: [1, 2]}),
                Rapid.osmNode({id: 'f', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'a']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection)(graph));
            expect(diff.changes).to.have.all.keys('a', 'b', 'c', 'f');
        });

        it('does not move or remove self-intersecting nodes', function() {
            //   f -- g
            //   |    |
            //   e --- d - c
            //        |    |
            //        a -- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [ 0, -1]}),
                Rapid.osmNode({id: 'b', loc: [ 1, -1]}),
                Rapid.osmNode({id: 'c', loc: [ 0,  1]}),
                Rapid.osmNode({id: 'd', loc: [ 0.1,  0]}),
                Rapid.osmNode({id: 'e', loc: [-1,  0]}),
                Rapid.osmNode({id: 'f', loc: [-1,  1]}),
                Rapid.osmNode({id: 'g', loc: [ 0,  1]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'd', 'a']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection)(graph));
            expect(diff.changes).to.not.have.any.keys('d');
            expect(graph.hasEntity('d')).to.be.ok;
        });

        it('preserves the shape of skinny quads', function () {
            var projection = new sdk.Projection();
            var tests = [[
                [-77.0339864831478, 38.8616391227204],
                [-77.0209775298677, 38.8613609264884],
                [-77.0210405781065, 38.8607390721519],
                [-77.0339024188294, 38.8610663645859]
            ], [
                [-89.4706683, 40.6261177],
                [-89.4706664, 40.6260574],
                [-89.4693973, 40.6260830],
                [-89.4694012, 40.6261355]
            ]];

            for (var i = 0; i < tests.length; i++) {
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: tests[i][0]}),
                    Rapid.osmNode({id: 'b', loc: tests[i][1]}),
                    Rapid.osmNode({id: 'c', loc: tests[i][2]}),
                    Rapid.osmNode({id: 'd', loc: tests[i][3]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);
                var initialWidth = sdk.geoSphericalDistance(graph.entity('a').loc, graph.entity('b').loc);
                graph = Rapid.actionOrthogonalize('-', projection)(graph);
                var finalWidth = sdk.geoSphericalDistance(graph.entity('a').loc, graph.entity('b').loc);
                expect(finalWidth / initialWidth).within(0.90, 1.10);
            }
        });
    });


    describe('open paths', function () {
        it('orthogonalizes a perfect quad path', function () {
            //    d --- c
            //          |
            //    a --- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(4);
        });

        it('orthogonalizes a quad path', function () {
            //    d --- c
            //          |
            //    a ---  b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(4);
        });

        it('orthogonalizes a 3-point path', function () {
            //    a
            //    |
            //    |
            //     b - c
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 3]}),
                Rapid.osmNode({id: 'b', loc: [0.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [3, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(3);
        });

        it('deletes empty redundant nodes', function() {
            //    e - d - c
            //            |
            //    a ----- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [1, 2]}),
                Rapid.osmNode({id: 'e', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.hasEntity('d')).to.be.undefined;
        });

        it('preserves non empty redundant nodes', function() {
            //    e - d - c
            //            |
            //    a ----- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [1, 2], tags: {foo: 'bar'}}),
                Rapid.osmNode({id: 'e', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph);
            expect(graph.entity('-').nodes).to.have.length(5);
            expect(graph.hasEntity('d')).to.be.ok;
        });

        it('only moves non-endpoint nodes which are near right or near straight', function() {
            //    f - e
            //         \
            //          d - c
            //              |
            //    a -------- b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [3.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [3, 1]}),
                Rapid.osmNode({id: 'd', loc: [2, 1]}),
                Rapid.osmNode({id: 'e', loc: [1, 2]}),
                Rapid.osmNode({id: 'f', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection)(graph));
            expect(diff.changes).to.have.all.keys('b', 'c');
        });

        it('does not move or remove self-intersecting nodes', function() {
            //   f -- g
            //   |    |
            //   e --- d - c
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'c', loc: [ 0,  1]}),
                Rapid.osmNode({id: 'd', loc: [ 0.1,  0]}),
                Rapid.osmNode({id: 'e', loc: [-1,  0]}),
                Rapid.osmNode({id: 'f', loc: [-1,  1]}),
                Rapid.osmNode({id: 'g', loc: [ 0,  1]}),
                Rapid.osmWay({id: '-', nodes: ['c', 'd', 'e', 'f', 'g', 'd']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection)(graph));
            expect(diff.changes).to.not.have.any.keys('d');
            expect(graph.hasEntity('d')).to.be.ok;
        });
    });


    describe('vertices', function () {
        it('orthogonalizes a single vertex in a quad', function () {
            //    d --- c
            //    |     |
            //    a ---  b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection, 'b')(graph));
            expect(diff.changes).to.have.all.keys('b');
            expect(diff.changes).to.not.have.any.keys('a', 'c', 'd');
        });

        it('orthogonalizes a single vertex in a triangle', function () {
            //    a
            //    | \
            //    |   \
            //     b - c
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 3]}),
                Rapid.osmNode({id: 'b', loc: [0.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [3, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'a']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection, 'b')(graph));
            expect(diff.changes).to.have.all.keys('b');
            expect(diff.changes).to.not.have.any.keys('a', 'c');
        });

        it('orthogonalizes a single vertex in a quad path', function () {
            //    d --- c
            //          |
            //    a ---  b
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [2, 2]}),
                Rapid.osmNode({id: 'd', loc: [0, 2]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection, 'b')(graph));
            expect(diff.changes).to.have.all.keys('b');
            expect(diff.changes).to.not.have.any.keys('a', 'c', 'd');
        });

        it('orthogonalizes a single vertex in a 3-point path', function () {
            //    a
            //    |
            //    |
            //     b - c
            var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 3]}),
                Rapid.osmNode({id: 'b', loc: [0.1, 0]}),
                Rapid.osmNode({id: 'c', loc: [3, 0]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c']})
            ]);

            var diff = new Rapid.Difference(graph, Rapid.actionOrthogonalize('-', projection, 'b')(graph));
            expect(diff.changes).to.have.all.keys('b');
            expect(diff.changes).to.not.have.any.keys('a', 'c');
        });
    });


    describe('#disabled', function () {

        describe('closed paths', function () {

            it('returns "square_enough" for a perfect quad', function () {
                //    d ---- c
                //    |      |
                //    a ---- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.eql('square_enough');
            });

            it('returns false for unsquared quad', function () {
                //    d --- c
                //    |     |
                //    a ---- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

            it('returns false for unsquared triangle', function () {
                //    a
                //    | \
                //    |   \
                //     b - c
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 3]}),
                    Rapid.osmNode({id: 'b', loc: [0.1, 0]}),
                    Rapid.osmNode({id: 'c', loc: [3, 0]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'a']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

            it('returns false for perfectly square shape with redundant nodes', function () {
                //    e - d - c
                //    |       |
                //    a ----- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [1, 2]}),
                    Rapid.osmNode({id: 'e', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'a']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

            it('returns "not_squarish" for shape that can not be squared', function () {
                //      e -- d
                //     /      \
                //    f        c
                //     \      /
                //      a -- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [1, 0]}),
                    Rapid.osmNode({id: 'b', loc: [3, 0]}),
                    Rapid.osmNode({id: 'c', loc: [4, 2]}),
                    Rapid.osmNode({id: 'd', loc: [3, 4]}),
                    Rapid.osmNode({id: 'e', loc: [1, 4]}),
                    Rapid.osmNode({id: 'f', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'a']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.eql('not_squarish');
            });

            it('returns false for non-square self-intersecting shapes', function() {
                //   f -- g
                //   |    |
                //   e --- d - c
                //        |    |
                //        a -- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [ 0, -1]}),
                    Rapid.osmNode({id: 'b', loc: [ 1, -1]}),
                    Rapid.osmNode({id: 'c', loc: [ 0,  1]}),
                    Rapid.osmNode({id: 'd', loc: [ 0.1,  0]}),
                    Rapid.osmNode({id: 'e', loc: [-1,  0]}),
                    Rapid.osmNode({id: 'f', loc: [-1,  1]}),
                    Rapid.osmNode({id: 'g', loc: [ 0,  1]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'd', 'a']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

        });


        describe('open paths', function () {

            it('returns "square_enough" for a perfect quad', function () {
                //    d ---- c
                //           |
                //    a ---- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.eql('square_enough');
            });

            it('returns false for unsquared quad', function () {
                //    d --- c
                //          |
                //    a ---  b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

            it('returns false for unsquared 3-point path', function () {
                //    a
                //    |
                //    |
                //     b - c
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 3]}),
                    Rapid.osmNode({id: 'b', loc: [0, 0.1]}),
                    Rapid.osmNode({id: 'c', loc: [3, 0]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

            it('returns false for perfectly square shape with redundant nodes', function () {
                //    e - d - c
                //            |
                //    a ----- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [1, 2]}),
                    Rapid.osmNode({id: 'e', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });

            it('returns "not_squarish" for path that can not be squared', function () {
                //      e -- d
                //     /      \
                //    f        c
                //            /
                //      a -- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [1, 0]}),
                    Rapid.osmNode({id: 'b', loc: [3, 0]}),
                    Rapid.osmNode({id: 'c', loc: [4, 2]}),
                    Rapid.osmNode({id: 'd', loc: [3, 4]}),
                    Rapid.osmNode({id: 'e', loc: [1, 4]}),
                    Rapid.osmNode({id: 'f', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.eql('not_squarish');
            });

            it('returns false for non-square self-intersecting paths', function() {
                //   f -- g
                //   |    |
                //   e --- d - c
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'c', loc: [ 0,  1]}),
                    Rapid.osmNode({id: 'd', loc: [ 0.1,  0]}),
                    Rapid.osmNode({id: 'e', loc: [-1,  0]}),
                    Rapid.osmNode({id: 'f', loc: [-1,  1]}),
                    Rapid.osmNode({id: 'g', loc: [ 0,  1]}),
                    Rapid.osmWay({id: '-', nodes: ['c', 'd', 'e', 'f', 'g', 'd']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection).disabled(graph);
                expect(result).to.be.false;
            });
        });

        describe('vertex-only', function () {

            it('returns "square_enough" for a vertex in a perfect quad', function () {
                //    d ---- c
                //           |
                //    a ---- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection, 'b').disabled(graph);
                expect(result).to.eql('square_enough');
            });

            it('returns false for a vertex in an unsquared quad', function () {
                //    d --- c
                //          |
                //    a ---  b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 0]}),
                    Rapid.osmNode({id: 'b', loc: [2.1, 0]}),
                    Rapid.osmNode({id: 'c', loc: [2, 2]}),
                    Rapid.osmNode({id: 'd', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection, 'b').disabled(graph);
                expect(result).to.be.false;
            });

            it('returns false for a vertex in an unsquared 3-point path', function () {
                //    a
                //    |
                //    |
                //     b - c
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [0, 3]}),
                    Rapid.osmNode({id: 'b', loc: [0, 0.1]}),
                    Rapid.osmNode({id: 'c', loc: [3, 0]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection, 'b').disabled(graph);
                expect(result).to.be.false;
            });

            it('returns "not_squarish" for vertex that can not be squared', function () {
                //      e -- d
                //     /      \
                //    f        c
                //            /
                //      a -- b
                var graph = new Rapid.Graph([
                    Rapid.osmNode({id: 'a', loc: [1, 0]}),
                    Rapid.osmNode({id: 'b', loc: [3, 0]}),
                    Rapid.osmNode({id: 'c', loc: [4, 2]}),
                    Rapid.osmNode({id: 'd', loc: [3, 4]}),
                    Rapid.osmNode({id: 'e', loc: [1, 4]}),
                    Rapid.osmNode({id: 'f', loc: [0, 2]}),
                    Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f']})
                ]);

                var result = Rapid.actionOrthogonalize('-', projection, 'b').disabled(graph);
                expect(result).to.eql('not_squarish');
            });

        });
    });

    describe('transitions', function () {
        it('is transitionable', function() {
            expect(Rapid.actionOrthogonalize().transitionable).to.be.true;
        });

        //  for all of these:
        //
        //     f ------------ e
        //     |              |
        //     a -- b -- c -- d

        it('orthogonalize at t = 0', function() {
           var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                Rapid.osmNode({id: 'c', loc: [2, -0.01]}),
                Rapid.osmNode({id: 'd', loc: [3, 0]}),
                Rapid.osmNode({id: 'e', loc: [3, 1]}),
                Rapid.osmNode({id: 'f', loc: [0, 1]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph, 0);
            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd', 'e', 'f', 'a']);
            expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-6);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0.01, 1e-6);
            expect(graph.entity('c').loc[0]).to.be.closeTo(2, 1e-6);
            expect(graph.entity('c').loc[1]).to.be.closeTo(-0.01, 1e-6);

        });

        it('orthogonalize at t = 0.5', function() {
           var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                Rapid.osmNode({id: 'c', loc: [2, -0.01]}),
                Rapid.osmNode({id: 'd', loc: [3, 0]}),
                Rapid.osmNode({id: 'e', loc: [3, 1]}),
                Rapid.osmNode({id: 'f', loc: [0, 1]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph, 0.5);
            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'd', 'e', 'f', 'a']);
            expect(graph.entity('b').loc[0]).to.be.closeTo(1, 1e-3);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0.005, 1e-3);
            expect(graph.entity('c').loc[0]).to.be.closeTo(2, 1e-3);
            expect(graph.entity('c').loc[1]).to.be.closeTo(-0.005, 1e-3);
        });

        it('orthogonalize at t = 1', function() {
           var graph = new Rapid.Graph([
                Rapid.osmNode({id: 'a', loc: [0, 0]}),
                Rapid.osmNode({id: 'b', loc: [1, 0.01], tags: {foo: 'bar'}}),
                Rapid.osmNode({id: 'c', loc: [2, -0.01]}),
                Rapid.osmNode({id: 'd', loc: [3, 0]}),
                Rapid.osmNode({id: 'e', loc: [3, 1]}),
                Rapid.osmNode({id: 'f', loc: [0, 1]}),
                Rapid.osmWay({id: '-', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'a']})
            ]);

            graph = Rapid.actionOrthogonalize('-', projection)(graph, 1);
            expect(graph.entity('-').nodes).to.eql(['a', 'b', 'd', 'e', 'f', 'a']);
            expect(graph.entity('b').loc[0]).to.be.closeTo(1, 2e-3);
            expect(graph.entity('b').loc[1]).to.be.closeTo(0, 2e-3);
            expect(graph.hasEntity('c')).to.eq(undefined);
        });
    });

});
