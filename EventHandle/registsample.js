iEvent.data
    .add('scene', new EventSeries('ChinaTown').Flag('chinatown'))
    .add(
        new SceneData('Intro', 'event')
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
            .Action('end', '<<run iEvent.setFlag("chinatown", "intro", 1)')
        ,
        new SceneData('Random_Vendor', 'event')
            .Trigger(
                'location',
                { location : ['chinatown'] , prevPassageIs : 'Stage Chinatown' },
                flags => flags.debug == 'vendor' && between(Time.hour, 6, 21)
            )
            .Action('init', '<<set $tvar.onselect to true>><<generateRole 0 0 "vendor">><<person1>>')
            .Action('end', '<<set $eventskip to 1 >>')
        ,
        new SceneData('StreetShow', 'scene')
            .Trigger(
                'location',
                { prevPassageIs : 'Stage Chinatown' },
                flags => flags.debug == 'show' || between(Time.hour, 10, 16) && random(100) < 36 && flags.showtoday < 3
            )
    );


iEvent.data
    .get('condition', 'common')
    .add(
        new SceneData('Chinatown RandomRumors', 'event')
            .Flags('chinatown')
            .Trigger(
                'match',
                { match : /[a-zA-Z]+ Street$|Park$/ },
                flags => flags.intro === undefined && V.location == 'town' && random(100) < 30 && Time.days > 2 && flags.rumorstoday < 2
            )
        ,
        new SceneData('Brothel DrugsIntro', 'event')
            .set({
                maxPhase : 3,
                exit     : 'Brothel Basement',
                stage    : 'Stage Brothel'
            })
            .Flags('brothel')
            .Trigger(
                'passage',
                { passage : 'Brothel Basement', prevPassageIs : 'Brothel' },
                flags => flags.drugsintro === undefined && V.brothel_basement_intro ==  1
            )
        ,
        new SceneData('Orphanage Garage Intro', 'event')
            .Flags('orphanage')
            .Trigger(
                'passage',
                { passage : 'Garden' },
                flags => flags.garageinit === undefined && flags.garageprocess >= 6 && Time.dayState == 'day'
            )
    );
