<h4>Страницы</h4>
<ul>
@foreach($result as $item)
    <li><a href="{{ route('url', $item->full_url) }}" target="_blank">{{ $item->title }}</a></li>
@endforeach
</ul>