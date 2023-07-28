describe('StreetsideService', () => {
  let _streetside, _projection;

  class MockContext {
    constructor() { }
    deferredRedraw() { }
  }

  beforeEach(() => {
    fetchMock.reset();

    _projection = new sdk.Projection()
      .scale(sdk.geoZoomToScale(14))
      .translate([-116508, 0])  // 10,0
      .dimensions([[0,0], [64, 64]]);

    _streetside = new Rapid.StreetsideService(new MockContext());
    return _streetside.initAsync();
  });


  afterEach(() => {
    window.JSONP_FIX = undefined;
  });


  describe('#initAsync', () => {
    it('initializes cache', () => {
      const cache = _streetside._cache;
      expect(cache).to.have.property('bubbles');
      expect(cache).to.have.property('sequences');
      expect(cache.bubbles).to.be.an.instanceof(Map);
      expect(cache.sequences).to.be.an.instanceof(Map);
    });
  });

  describe('#resetAsync', () => {
    it('resets cache', () => {
      _streetside._cache.bubbles.set('foo', { id: 'foo' });

      return _streetside.resetAsync()
        .then(() => expect(_streetside._cache.bubbles.has('foo')).to.be.false);
    });
  });


  describe('#loadBubbles', () => {
    it('fires loadedData when bubbles are loaded', done => {
      // adjust projection so that only one tile is fetched
      // (JSONP hack will return the same data for every fetch)
      _projection
        .scale(sdk.geoZoomToScale(18))
        .translate([-1863988.9381333336, 762.8270222954452])  // 10.002,0.002
        .dimensions([[0,0], [64,64]]);

      const spy = sinon.spy();
      _streetside.on('loadedData', spy);

      window.JSONP_DELAY = 0;
      window.JSONP_FIX = [{
          elapsed: 0.001
        }, {
          id: 1, la: 0, lo: 10.001, al: 0, ro: 0, pi: 0, he: 0, bl: '',
          cd: '1/1/2018 12:00:00 PM', ml: 3, nbn: [], pbn: [], rn: [],
          pr: undefined, ne: 2
        }, {
          id: 2, la: 0, lo: 10.002, al: 0, ro: 0, pi: 0, he: 0, bl: '',
          cd: '1/1/2018 12:00:01 PM', ml: 3, nbn: [], pbn: [], rn: [],
          pr: 1, ne: 3
        }, {
          id: 3, la: 0, lo: 10.003, al: 0, ro: 0, pi: 0, he: 0, bl: '',
          cd: '1/1/2018 12:00:02 PM', ml: 3, nbn: [], pbn: [], rn: [],
          pr: 2, ne: undefined
        }
      ];

      _streetside.loadBubbles(_projection, 0);  // 0 = don't fetch margin tiles

      window.setTimeout(() => {
        expect(spy).to.have.been.calledOnce;
        done();
      }, 50);
    });

    it('does not load bubbles around null island', done => {
      _projection
        .scale(sdk.geoZoomToScale(18))
        .translate([0, 0])
        .dimensions([[0,0], [64,64]]);

      const spy = sinon.spy();
      _streetside.on('loadedData', spy);

      window.JSONP_DELAY = 0;
      window.JSONP_FIX = [{
          elapsed: 0.001
        }, {
          id: 1, la: 0, lo: 0, al: 0, ro: 0, pi: 0, he: 0, bl: '',
          cd: '1/1/2018 12:00:00 PM', ml: 3, nbn: [], pbn: [], rn: [],
          pr: undefined, ne: 2
        }, {
          id: 2, la: 0, lo: 0, al: 0, ro: 0, pi: 0, he: 0, bl: '',
          cd: '1/1/2018 12:00:01 PM', ml: 3, nbn: [], pbn: [], rn: [],
          pr: 1, ne: 3
        }, {
          id: 3, la: 0, lo: 0, al: 0, ro: 0, pi: 0, he: 0, bl: '',
          cd: '1/1/2018 12:00:02 PM', ml: 3, nbn: [], pbn: [], rn: [],
          pr: 2, ne: undefined
        }
      ];

      _streetside.loadBubbles(_projection, 0);  // 0 = don't fetch margin tiles

      window.setTimeout(() => {
        expect(spy).to.have.been.not.called;
        done();
      }, 50);
    });
  });


  describe('#bubbles', () => {
    it('returns bubbles in the visible map area', () => {
      const bubbles = [
        { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '1', loc: [10, 0], ca: 90, pr: undefined, ne: '2', isPano: true } },
        { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '2', loc: [10, 0], ca: 90, pr: '1', ne: '3', isPano: true } },
        { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { id: '3', loc: [10, 1], ca: 90, pr: '2', ne: undefined, isPano: true } }
      ];

      const cache = _streetside._cache;
      cache.rtree.load(bubbles);

      const result = _streetside.bubbles(_projection);
      expect(result).to.deep.eql([
        { id: '1', loc: [10, 0], ca: 90, pr: undefined, ne: '2', isPano: true },
        { id: '2', loc: [10, 0], ca: 90, pr: '1', ne: '3', isPano: true }
      ]);
    });
  });


  describe('#sequences', () => {
    it('returns sequence linestrings in the visible map area', () => {
      const bubbles = [
        { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '1', loc: [10, 0], ca: 90, pr: undefined, ne: '2', isPano: true } },
        { minX: 10, minY: 0, maxX: 10, maxY: 0, data: { id: '2', loc: [10, 0], ca: 90, pr: '1', ne: '3', isPano: true } },
        { minX: 10, minY: 1, maxX: 10, maxY: 1, data: { id: '3', loc: [10, 1], ca: 90, pr: '2', ne: undefined, isPano: true } }
      ];

      const sequence = {
        id: 's1',
        v: 1,
        bubbleIDs: bubbles.map(d => d.data.id),
        coordinates: bubbles.map(d => d.data.loc)
      };

      const cache = _streetside._cache;
      cache.rtree.load(bubbles);
      cache.sequences.set('s1', sequence);
      cache.bubbleHasSequences.set('1', ['s1']);
      cache.bubbleHasSequences.set('2', ['s1']);
      cache.bubbleHasSequences.set('3', ['s1']);

      const result = _streetside.sequences(_projection);
      expect(result).to.deep.eql([sequence]);
    });
  });

});
