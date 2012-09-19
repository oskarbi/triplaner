from django.utils import simplejson
from django.core.cache import cache
from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect

from json import loads
from simplerouting.src import simple_routing

def home(request):
    """Load the main (and unique) page of Triplaner.

    Return a JSON with the list of stops loaded in the graph by simple_routing.
    """
    router = get_router()

    stop_list = []
    for stop_id in router.graph.get_stops():
        stop = router.graph.get_stop(stop_id)
        stop_list.append({
            "stop_id": stop.stop_id,
            "lat": stop.lat,
            "lon": stop.lon,
            "stop_name": stop.name
            })
    geodata = simplejson.dumps(stop_list)

    template_name = 'base.html'
    template_fields = {'geodata': geodata}
    return render_to_response(template_name, template_fields)

def get_shortest_path(request):
    """Handle a GET request for a path between two stops.

    Return a JSON with the shortest path calculated by simple_routing.
    """
    origin = request.GET[u'origin']
    destination = request.GET[u'destination']

    response = {}
    response['request'] = [origin, destination]
    try:
        router = get_router()
        path, dist = router.run(origin, destination)
        response['result_code'] = 0
        response['response'] = {'path': path,
                                'distance': dist}
    except Exception as ex:
        response['result_code'] = 1
        response['response'] = (
            "Sorry, I can't find any path between those stops."
            "\n\nPlease, try another combination.")

    return HttpResponse(simplejson.dumps(response),
                        mimetype='application/json')

def get_router():
    """Handle the instantiation of the Router and the loading of the Graph.

    As loading the graph is expensive, we use local-memory caching to keep in
    memory and load it only the first time.
    """
    router = cache.get('router')
    if not router:
        router = simple_routing.Router()
        router.load_graph()
        cache.set('router', router)
    return router
