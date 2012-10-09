from django.conf.urls import patterns, include, url

urlpatterns = patterns('routeplanner.views',
    url(r'^$', 'home', name='home'),
    url(r'^route/$', 'get_shortest_path', name='route'),
    url(r'^connected-stops/$', 'get_connected_stops', name='connected-stops'),
)
