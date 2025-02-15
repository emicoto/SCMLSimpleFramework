const testSeries = new SEvent('scene', 'TestStage');

testSeries.data('Intro', 'event')
    .set(
        {
            maxPhase : 2,
            exit     : 'Stage Chinatown',
            priority : 1000
        }
    )
    .Trigger(
        'scene',
        { prevPassageIsnot : 'Stage Chinatown' },
        flags =>  !flags.intro
    )
    .Action('end', () => iEvent.setFlag('chinatown', 'intro', 1));

testSeries.data('Random_Vendor', 'event')
    .Trigger(
        'location',
        { location : ['chinatown'] , prevPassageIs : 'Stage Chinatown' },
        flags => flags.debug == 'vendor' && between(Time.hour, 6, 21)
    )
    .Action('init', '<<generateRole 0 0 "vendor">><<person1>>')
    .Action('end', '<<set $eventskip to 1 >>');

testSeries.data('StreetShow', 'scene')
    .Trigger(
        'location',
        { prevPassageIs : 'Stage Chinatown' },
        flags => flags.debug == 'show' || between(Time.hour, 10, 16) && random(100) < 36 && flags.showtoday < 3
    );

const testAction = new LocalAction('TestStage');

testAction.new()
    .DisplayTxt({ CN : '测试', EN : 'Test' })
    .Target('Domus Street')
    .Icon('icon-test')
    .Code('<<set $test to 1>>')
    .Cond(() => !iEvent.getFlag('test'));
