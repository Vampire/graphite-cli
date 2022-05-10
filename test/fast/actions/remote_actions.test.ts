import { expect } from 'chai';
import { push } from '../../../src/actions/submit/push_branch';
import { pushMetadataRef } from '../../../src/actions/submit/push_metadata';
import { mergeDownstack } from '../../../src/actions/sync/merge_downstack';
import { pruneRemoteBranchMetadata } from '../../../src/actions/sync/prune_remote_branch_metadata';
import { pull } from '../../../src/actions/sync/pull';
import { execStateConfig } from '../../../src/lib/config/exec_state_config';
import { Branch } from '../../../src/wrapper-classes/branch';
import { CloneScene } from '../../lib/scenes/clone_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new CloneScene()]) {
  // eslint-disable-next-line max-lines-per-function
  describe('handle remote actions properly (sync/submit)', function () {
    configureTest(this, scene);

    it('can push a branch and its metadata to remote', async () => {
      scene.repo.createChange('1');
      scene.repo.execCliCommand(`branch create 1 -am "1"`);
      expect(scene.repo.currentBranchName()).to.equal('1');

      push(new Branch('1'), scene.context);
      pushMetadataRef(new Branch('1'), scene.context);

      expect(scene.repo.getRef('refs/heads/1')).to.equal(
        scene.originRepo.getRef('refs/heads/1')
      );
      expect(scene.repo.getRef('refs/branch-metadata/1')).to.equal(
        scene.originRepo.getRef('refs/branch-metadata/1')
      );
    });

    it('fails to push to a branch with external commits', () => {
      scene.repo.createChange('1');
      scene.repo.execCliCommand(`branch create 1 -am "1"`);
      expect(scene.repo.currentBranchName()).to.equal('1');

      scene.originRepo.createChange('2');
      scene.originRepo.execCliCommand(`branch create 1 -am "1"`);
      expect(scene.originRepo.getRef('refs/heads/1')).to.not.equal(
        scene.repo.getRef('refs/heads/1')
      );

      expect(() => push(new Branch('1'), scene.context)).to.throw();
    });

    it('can fetch a branch and its metadata from remote', async () => {
      scene.originRepo.createChangeAndCommit('a');
      scene.originRepo.createChange('1');
      scene.originRepo.execCliCommand(`branch create 1 -am "1"`);

      pull(scene.context, scene.repo.currentBranchName());
      await pruneRemoteBranchMetadata(scene.context, true);

      expect(scene.repo.getRef('refs/heads/main')).to.equal(
        scene.originRepo.getRef('refs/heads/main')
      );
      expect(scene.repo.getRef('refs/remotes/origin/1')).to.equal(
        scene.originRepo.getRef('refs/heads/1')
      );
      expect(scene.repo.getRef('refs/origin-branch-metadata/1')).to.equal(
        scene.originRepo.getRef('refs/branch-metadata/1')
      );

      scene.originRepo.checkoutBranch('main');
      scene.originRepo.execGitCommand(`branch -D 1`);

      pull(scene.context, scene.repo.currentBranchName());
      await pruneRemoteBranchMetadata(scene.context, true);

      expect(scene.repo.getRef('refs/origin-branch-metadata/1')).to.be
        .undefined;
      expect(scene.originRepo.getRef('refs/branch-metadata/1')).to.be.undefined;
    });

    it('can sync a remote stack', async () => {
      scene.originRepo.createChange('1');
      scene.originRepo.execCliCommand(`branch create 1 -am "1"`);
      scene.originRepo.createChange('2');
      scene.originRepo.execCliCommand(`branch create 2 -am "2"`);

      pull(scene.context, scene.repo.currentBranchName());
      expect(scene.repo.getRef('refs/remotes/origin/1')).to.equal(
        scene.originRepo.getRef('refs/heads/1')
      );
      expect(scene.repo.getRef('refs/origin-branch-metadata/1')).to.equal(
        scene.originRepo.getRef('refs/branch-metadata/1')
      );

      expect(scene.repo.getRef('refs/remotes/origin/2')).to.equal(
        scene.originRepo.getRef('refs/heads/2')
      );
      expect(scene.repo.getRef('refs/origin-branch-metadata/2')).to.equal(
        scene.originRepo.getRef('refs/branch-metadata/2')
      );

      await mergeDownstack('2', scene.context);

      expect(scene.repo.getRef('refs/heads/1')).to.equal(
        scene.originRepo.getRef('refs/heads/1')
      );
      expect(scene.repo.getRef('refs/branch-metadata/1')).to.equal(
        scene.originRepo.getRef('refs/branch-metadata/1')
      );

      expect(scene.repo.getRef('refs/heads/2')).to.equal(
        scene.originRepo.getRef('refs/heads/2')
      );
      expect(scene.repo.getRef('refs/branch-metadata/2')).to.equal(
        scene.originRepo.getRef('refs/branch-metadata/2')
      );
    });

    it("doesn't sync a branch with a local copy", async () => {
      scene.originRepo.createChange('1');
      scene.originRepo.execCliCommand(`branch create 1 -am "1"`);

      scene.repo.createChange('2');
      scene.repo.execCliCommand(`branch create 1 -am "1"`);

      scene.repo.execCliCommand(`branch checkout main`);
      pull(scene.context, scene.repo.currentBranchName());

      execStateConfig._data.interactive = false;
      await mergeDownstack('1', scene.context);
      expect(scene.repo.getRef('refs/heads/1')).to.not.equal(
        scene.originRepo.getRef('refs/heads/1')
      );
    });
  });
}
