module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        mochaTest: {
            src: ['src/**/*.spec.js'],
            options: {
                reporter: 'spec'
            }
        },
        jshint: {
            options: {
                globals: {
                    jQuery: true,
                    expect: true
                },
                force: true,
                mocha: true,
                node: true,
                browser: true,
                expr: true
            },
            files: ['src/**/*.js', 'test/**/*.js']
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        },
        less: {
            development: {
                options: {
                    compress: true
                },
                files: {
                    'main.css': 'assets/less/**/*.less'
                }
            }
        },
        uglify: {
            client: {
                files: {
                    'client.min.js': ['assets/js/client.js']
                }
            }
        },
        browserify: {
            client: {
                src: ['src/client/client.js'],
                dest: 'assets/js/client.js',
                options: {
                    external: ['jquery'],
                }
            }
        }
    });

    grunt.registerTask('default', ['browserify', 'jshint']);
    grunt.registerTask('production', ['browserify', 'uglify']);

};
