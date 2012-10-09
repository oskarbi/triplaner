from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
    url(r'^$', 'routeplanner.views.home', name='home'),
    url(r'^route/$', 'routeplanner.views.get_shortest_path', name='route'),
    url(r'^connected-stops/$', 'routeplanner.views.get_connected_stops', name='connected-stops'),
)
