import * as cdk from 'aws-cdk-lib';
import * as Personalize from '../lib/personalize-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Personalize.PersonalizeStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
