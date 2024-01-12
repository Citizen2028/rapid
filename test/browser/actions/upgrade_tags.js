describe('actionUpgradeTags', function () {

    it('upgrades a tag', function () {
        var oldTags = { amenity: 'swimming_pool' },
            newTags = { leisure: 'swimming_pool' },
            entity = Rapid.osmEntity({ tags: { amenity: 'swimming_pool', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ leisure: 'swimming_pool', name: 'Foo' });
    });

    it('upgrades a tag combination', function () {
        var oldTags = { amenity: 'vending_machine', vending: 'news_papers' },
            newTags = { amenity: 'vending_machine', vending: 'newspapers' },
            entity = Rapid.osmEntity({ tags: { amenity: 'vending_machine', vending: 'news_papers', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ amenity: 'vending_machine', vending: 'newspapers', name: 'Foo' });
    });

    it('upgrades a tag with multiple replacement tags', function () {
        var oldTags = { natural: 'marsh' },
            newTags = { natural: 'wetland', wetland: 'marsh' },
            entity = Rapid.osmEntity({ tags: { natural: 'marsh', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ natural: 'wetland', wetland: 'marsh', name: 'Foo' });
    });

    it('upgrades a tag and overrides an existing value', function () {
        var oldTags = { landuse: 'wood' },
            newTags = { natural: 'wood' },
            entity = Rapid.osmEntity({ tags: { landuse: 'wood', natural: 'wetland', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ natural: 'wood', name: 'Foo' });
    });

    it('upgrades a tag with no replacement tags', function () {
        var oldTags = { highway: 'no' },
            newTags,
            entity = Rapid.osmEntity({ tags: { highway: 'no', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ name: 'Foo' });
    });

    it('upgrades a wildcard tag and moves the value', function () {
        var oldTags = { color: '*' },
            newTags = { colour: '$1' },
            entity = Rapid.osmEntity({ tags: { color: 'red', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ colour: 'red', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and adds a default value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = Rapid.osmEntity({ tags: { amenity: 'shop', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'yes', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and maintains the existing value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = Rapid.osmEntity({ tags: { amenity: 'shop', shop: 'supermarket', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'supermarket', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and replaces the existing "no" value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = Rapid.osmEntity({ tags: { amenity: 'shop', shop: 'no', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'yes', name: 'Foo' });
    });

    it('upgrades a tag from a semicolon-delimited list that has one other value', function () {
        var oldTags = { cuisine: 'vegan' },
            newTags = { 'diet:vegan': 'yes' },
            entity = Rapid.osmEntity({ tags: { cuisine: 'italian;vegan', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ cuisine: 'italian', 'diet:vegan': 'yes', name: 'Foo' });
    });

    it('upgrades a tag from a semicolon-delimited list that has many other values', function () {
        var oldTags = { cuisine: 'vegan' },
            newTags = { 'diet:vegan': 'yes' },
            entity = Rapid.osmEntity({ tags: { cuisine: 'italian;vegan;regional;american', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ cuisine: 'italian;regional;american', 'diet:vegan': 'yes', name: 'Foo' });
    });

    it('upgrades a tag within a semicolon-delimited list without changing other values', function () {
        var oldTags = { leisure: 'ice_rink', sport: 'hockey' },
            newTags = { leisure: 'ice_rink', sport: 'ice_hockey' },
            entity = Rapid.osmEntity({ tags: { leisure: 'ice_rink', sport: 'curling;hockey;multi', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ leisure: 'ice_rink', sport: 'curling;ice_hockey;multi', name: 'Foo' });
    });

    it('upgrades an entire semicolon-delimited tag value', function () {
        var oldTags = { vending: 'parcel_mail_in;parcel_pickup' },
            newTags = { vending: 'parcel_pickup;parcel_mail_in' },
            entity = Rapid.osmEntity({ tags: { vending: 'parcel_mail_in;parcel_pickup', name: 'Foo' }}),
            graph  = Rapid.actionUpgradeTags(entity.id, oldTags, newTags)(new Rapid.Graph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ vending: 'parcel_pickup;parcel_mail_in', name: 'Foo' });
    });

});
