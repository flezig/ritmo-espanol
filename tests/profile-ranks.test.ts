import test from 'node:test';
import assert from 'node:assert/strict';
import { profileRankForXp, profileRanks } from '../app/lib/profile-ranks.ts';

test('profile ranks cover twenty stable XP levels', () => {
  assert.equal(profileRanks.length, 20);
  assert.equal(profileRanks[0].xp, 0);
  assert.equal(profileRanks.at(-1)?.xp, 22_000);
  assert.equal(
    profileRanks.every((rank, index) => !index || rank.xp > profileRanks[index - 1].xp),
    true,
  );
});

test('rank titles follow profile gender and preserve XP progress', () => {
  const male = profileRankForXp(865, 'H'),
    female = profileRankForXp(865, 'M');
  assert.equal(male.level, 5);
  assert.equal(male.title, 'Viajero');
  assert.equal(female.title, 'Viajera');
  assert.equal(male.remaining, 135);
  assert.equal(male.progress, female.progress);
});

test('the default title is masculine and the final rank is capped', () => {
  assert.equal(profileRankForXp(3_200).title, 'Señor');
  const final = profileRankForXp(99_999, 'M');
  assert.equal(final.level, 20);
  assert.equal(final.title, 'Maestra del Ritmo');
  assert.equal(final.next, null);
  assert.equal(final.progress, 100);
});
