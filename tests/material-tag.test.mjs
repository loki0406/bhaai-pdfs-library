import test from 'node:test';
import assert from 'node:assert/strict';
import {materialTag} from '../src/material-tag.js';
test('only explicitly selected materials receive the logo stamp',()=>{
 assert.equal(materialTag({}),'');assert.equal(materialTag({card_tag:''}),'');
 assert.equal(materialTag({card_tag:'<script>bad</script>'}),'');
 assert.match(materialTag({card_tag:'bhaai-pick'}),/BHAAI PICK/);
 assert.match(materialTag({card_tag:'bhaai-pick'}),/src="\/logo.jpeg"/);
});
