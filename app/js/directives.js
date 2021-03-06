'use strict';

/* Directives */


angular.module('myApp.directives', []).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }]).

    /**
     * Switch the a tab when the element is clicked
     *
     * Usage:
     *
     *     <ul class="nav nav-tabs">
     *         <li class="tabspacing active"><a data-target="#pane1" data-toggle="tab">Tests</a></li>
     *         <li class="tabspacing"><a id="result-tab" data-target="#pane2" data-toggle="tab">results</a></li>
     *     </ul>
     *     [...]
     *     <button ng-click="runTests()" gen-switch-tab="#result-tab">Run test</button>
     */
    directive('genSwitchTab', ['$window', function(window) {
        var $ = window.jQuery;
        return {
            link: function(_, element, attr) {
                var doSwitch = function(){
                    $(attr.genSwitchTab).tab('show');
                };

                $(element).on('click', doSwitch);

                element.on('$destroy', function() {
                    $(element).off('click', doSwitch);
                });

            }
        };
    }]).

    /**
     * Set the first tab as active if none is active
     *
     * Usage:
     *
     *     <ul class="nav nav-tabs" gen-init-tab="true">
     *         <li class="tabspacing active"><a data-target="#pane1" data-toggle="tab">Tests</a></li>
     *         <li class="tabspacing"><a id="result-tab" data-target="#pane2" data-toggle="tab">results</a></li>
     *     </ul>
     */
    directive('genInitTab', function() {
        return {
            link: function(_, element) {
                if (element.find('li.active').length > 0) {
                    return;
                }
                
                element.find('li:eq(0)').addClass('active');
            }
        };
    }).

    /**
     * Create a ace editor
     *
     * Usage:
     *
     *     <div ng-model="code" gen-ace="codeSyntax"></div>
     *
     * where $scope.code should be a string and $scope.codeLanguage should be
     * the syntax mode use to highlight the code (edito mode).
     *
     * unlike the uiAce directive, this directive can dynamically change the 
     * editor mode.
     * 
     */
    directive('genAce', ['ace', function(ace) {
        return {
            require: '?ngModel',
            link: function (scope, elm, attrs, ngModel) {
                var editor = window.ace.edit(elm[0]),
                    session = editor.getSession();

                scope.$watch(attrs.genAce, function(newVal) {
                    if (newVal) {
                        session.setMode('ace/mode/' + newVal);
                    }
                });

                elm.on('$destroy', function() {
                  editor.session.$stopWorker();
                  editor.destroy();
                });

                if (!ngModel) {
                    return;
                }

                session.on('change', function (callback) {
                    var newValue = session.getValue();

                    if (newValue === scope.$eval(attrs.value) ||
                        scope.$$phase  ||
                        scope.$root.$$phase
                    ) {
                        return;
                    }

                    scope.$apply(function () {
                        ngModel.$setViewValue(newValue);
                    });
                });

                ngModel.$render = function () {
                    session.setValue(ngModel.$viewValue);
                };

                ngModel.$formatters.push(function (value) {
                    if (!value) {
                        return '';
                    }

                    return value.toString();
                });
            }
        };
    }])

    .directive('bsButtonsRadio', function ($timeout) {

        var type = 'button',
            dataPrefix = !!$.fn.emulateTransitionEnd ? 'bs.' : '',
            evSuffix = dataPrefix ? '.' + dataPrefix + type : '';

        var evName = 'click' + evSuffix + '.data-api';

        return {
            restrict: 'A',
            require: '?ngModel',
            compile: function compile(tElement, tAttrs, transclude) {

                tElement.attr('data-toggle', 'buttons-radio');

                // Delegate to children ngModel
                if (!tAttrs.ngModel) {
                    tElement.find('a, button').each(function (k, v) {
                        $(v).attr('bs-button', '');
                    });
                }

                return function postLink(scope, iElement, iAttrs, controller) {

                    // If we have a controller (i.e. ngModelController) then wire it up
                    if (controller) {

                        $timeout(function () {
                            iElement
                                .find('[value]')
                                .filter('[value="' + controller.$viewValue + '"]')
                                .addClass('active');
                        }, 0, false);

                        iElement.on(evName, function (ev) {
                            scope.$apply(function () {
                                controller.$setViewValue($(ev.target).closest('button').attr('value'));
                            });
                        });

                        // Watch model for changes
                        scope.$watch(iAttrs.ngModel, function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                var $btn = iElement.find('[value="' + scope.$eval(iAttrs.ngModel) + '"]');
                                if ($btn.length) {
                                    $btn.toggleClass('active');
                                }
                            }
                        });

                    }

                };
            }
        };

    });